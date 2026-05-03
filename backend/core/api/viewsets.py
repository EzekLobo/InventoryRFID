from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from core.domain.models import (
    AntenaRFID,
    ItemPatrimonial,
    NotificacaoInconsistencia,
    TimelineEvento,
)
from core.domain.services import AuditoriaManager, SyncManager
from core.middleware.rfid_handler import RFIDEventProcessor


class MovimentacaoSerializer(serializers.Serializer):
    tag_id = serializers.CharField(max_length=64)
    local_id = serializers.IntegerField(required=False, min_value=1)
    antenna_id = serializers.IntegerField(required=False, allow_null=True)
    payload = serializers.JSONField(required=False)

    def validate(self, attrs):
        if not attrs.get("antenna_id") and not attrs.get("local_id"):
            raise serializers.ValidationError("Informe antenna_id ou local_id.")
        return attrs


class BroadcastSerializer(serializers.Serializer):
    duracao_segundos = serializers.IntegerField(required=False, min_value=1, default=5)


class BaixaManualSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=255, default="baixa patrimonial")


class AcionamentoAntenaSerializer(serializers.Serializer):
    duracao_segundos = serializers.IntegerField(required=False, min_value=1, default=5)


class RFIDEventSerializer(serializers.Serializer):
    event_type = serializers.ChoiceField(choices=["ping", "motion_detected", "tags_read"])
    antenna_id = serializers.IntegerField(min_value=1)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        allow_empty=True,
    )
    payload = serializers.JSONField(required=False)

    def validate(self, attrs):
        payload = attrs.get("payload") or {}
        is_audit = bool(payload.get("audit") or payload.get("auditoria_job_id"))
        if attrs["event_type"] == "tags_read" and not attrs.get("tags") and not is_audit:
            raise serializers.ValidationError("tags sao obrigatorias para tags_read.")
        return attrs


class TimelineListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvento
        fields = ["id", "item_id", "tipo", "mensagem", "metadados", "criado_em", "usuario_id"]


class InconsistenciaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificacaoInconsistencia
        fields = [
            "id",
            "item_id",
            "tipo",
            "tag_id",
            "local_logico_id",
            "local_fisico_id",
            "resolvida",
            "metadados",
            "criado_em",
            "resolvida_em",
        ]


class AntenaRFIDListSerializer(serializers.ModelSerializer):
    local_nome = serializers.CharField(source="local.nome", read_only=True)
    local_codigo = serializers.CharField(source="local.codigo", read_only=True)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = AntenaRFID
        fields = [
            "id",
            "nome",
            "hardware_id",
            "local_id",
            "local_nome",
            "local_codigo",
            "tipo",
            "tipo_display",
            "ativa",
            "ativacao_expira_em",
            "ultimo_acionamento",
            "ultimo_ping",
            "online",
        ]


class ItemPatrimonialListSerializer(serializers.ModelSerializer):
    local_logico_nome = serializers.CharField(source="local_logico.nome", read_only=True)
    local_fisico_nome = serializers.CharField(source="local_fisico.nome", read_only=True)
    responsavel_nome = serializers.CharField(source="responsavel.get_username", read_only=True)

    class Meta:
        model = ItemPatrimonial
        fields = [
            "id",
            "tag_id",
            "nome",
            "local_logico_id",
            "local_logico_nome",
            "local_fisico_id",
            "local_fisico_nome",
            "responsavel_id",
            "responsavel_nome",
            "ativo",
            "atualizado_em",
        ]


class AntenaRFIDViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AntenaRFIDListSerializer
    permission_classes = [IsAuthenticated]
    event_processor = RFIDEventProcessor()

    def get_queryset(self):
        queryset = AntenaRFID.objects.select_related("local").order_by("id")
        tipo = self.request.query_params.get("tipo")
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        online = self.request.query_params.get("online")
        if online in {"true", "True", "1"}:
            queryset = queryset.filter(online=True)
        elif online in {"false", "False", "0"}:
            queryset = queryset.filter(online=False)
        return queryset

    @action(detail=True, methods=["post"], url_path="ativar")
    def ativar(self, request, pk=None):
        return self._acionar(request=request, pk=pk, audit=False)

    @action(detail=True, methods=["post"], url_path="auditar")
    def auditar(self, request, pk=None):
        return self._acionar(request=request, pk=pk, audit=True)

    def _acionar(self, *, request, pk=None, audit: bool):
        serializer = AcionamentoAntenaSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        antenna = self.get_queryset().filter(id=pk).first()
        if antenna is None:
            return Response(
                {"status": "erro", "detail": "Antena nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        duracao = serializer.validated_data["duracao_segundos"]
        now = timezone.now()
        antenna.ativa = True
        antenna.ultimo_acionamento = now
        antenna.ativacao_expira_em = now + timedelta(seconds=duracao)
        antenna.save(update_fields=["ativa", "ultimo_acionamento", "ativacao_expira_em"])
        return Response(
            {
                "status": "auditoria_iniciada" if audit else "leitura_iniciada",
                "antenna_id": antenna.id,
                "hardware_id": antenna.hardware_id,
                "active_for_seconds": duracao,
                "expires_at": antenna.ativacao_expira_em,
                "payload": {"audit": True} if audit else {},
            },
            status=status.HTTP_200_OK,
        )


class ItemPatrimonialViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    sync_manager = SyncManager()

    def list(self, request):
        queryset = ItemPatrimonial.objects.select_related(
            "local_logico",
            "local_fisico",
            "responsavel",
        ).order_by("nome")
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(nome__icontains=search) | queryset.filter(tag_id__icontains=search)
        ativo = request.query_params.get("ativo")
        if ativo in {"true", "True", "1"}:
            queryset = queryset.filter(ativo=True)
        elif ativo in {"false", "False", "0"}:
            queryset = queryset.filter(ativo=False)
        serializer = ItemPatrimonialListSerializer(queryset[:200], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        item = ItemPatrimonial.objects.select_related(
            "local_logico",
            "local_fisico",
            "responsavel",
        ).filter(id=pk).first()
        if item is None:
            return Response(
                {"status": "erro", "detail": "Item patrimonial nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ItemPatrimonialListSerializer(item).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="inativar")
    def inativar(self, request, pk=None):
        serializer = BaixaManualSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        item = ItemPatrimonial.objects.filter(id=pk).first()
        if item is None:
            return Response(
                {"status": "erro", "detail": "Item patrimonial nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        item = self.sync_manager.deactivate_item_manually(
            item_id=item.id,
            motivo=serializer.validated_data["motivo"],
            usuario=request.user,
        )
        return Response(
            {
                "status": "inativado",
                "item_id": item.id,
                "tag_id": item.tag_id,
                "ativo": item.ativo,
                "motivo": serializer.validated_data["motivo"],
            },
            status=status.HTTP_200_OK,
        )


class MovimentacaoViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    event_processor = RFIDEventProcessor()

    def create(self, request):
        payload = dict(request.data)
        if "TagID" in payload and "tag_id" not in payload:
            payload["tag_id"] = payload["TagID"]
        if "LocalID" in payload and "local_id" not in payload:
            payload["local_id"] = payload["LocalID"]
        if "AntennaID" in payload and "antenna_id" not in payload:
            payload["antenna_id"] = payload["AntennaID"]

        serializer = MovimentacaoSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if not ItemPatrimonial.objects.filter(tag_id=data["tag_id"]).exists():
            return Response(
                {"status": "erro", "detail": "Tag RFID nao cadastrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        antenna = self._resolve_antenna(data=data)
        if antenna is None:
            return Response(
                {"status": "erro", "detail": "Nao foi possivel identificar uma antena para a movimentacao."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.event_processor.deactivate_expired_antennas()
        # Alias para fluxo de evento físico: tags_read
        if not antenna.ativa:
            antenna.ativa = True
            antenna.ultimo_acionamento = timezone.now()
            antenna.ativacao_expira_em = timezone.now() + timedelta(seconds=5)
            antenna.save(update_fields=["ativa", "ultimo_acionamento", "ativacao_expira_em"])
        result = self.event_processor.process_tags_read(
            antenna=antenna,
            tags=[data["tag_id"]],
            payload=data.get("payload"),
        )
        return Response(result, status=status.HTTP_201_CREATED)

    def _resolve_antenna(self, *, data: dict):
        antenna_id = data.get("antenna_id")
        if antenna_id:
            return AntenaRFID.objects.filter(id=antenna_id).first()
        local_id = data.get("local_id")
        if local_id:
            return (
                AntenaRFID.objects.filter(local_id=local_id, tipo=AntenaRFID.TipoAntena.DESTINO)
                .order_by("id")
                .first()
            )
        return None


class RFIDEventosViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    event_processor = RFIDEventProcessor()

    def _validate_ingest_token(self, request):
        expected_token = getattr(settings, "RFID_INGEST_TOKEN", "")
        provided_token = request.headers.get("X-RFID-Token", "")
        return expected_token and provided_token == expected_token

    def create(self, request):
        if not self._validate_ingest_token(request):
            return Response(
                {"status": "erro", "detail": "Token de ingestao invalido."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = RFIDEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        antenna = AntenaRFID.objects.filter(id=data["antenna_id"]).first()
        if antenna is None:
            return Response(
                {"status": "erro", "detail": "Antena nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        event_type = data["event_type"]
        if event_type == "ping":
            result = self.event_processor.process_ping(antenna=antenna)
        elif event_type == "motion_detected":
            result = self.event_processor.process_motion_detected(antenna=antenna)
        else:
            result = self.event_processor.process_tags_read(
                antenna=antenna,
                tags=data.get("tags", []),
                payload=data.get("payload"),
            )
        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="comando")
    def comando(self, request):
        if not self._validate_ingest_token(request):
            return Response(
                {"status": "erro", "detail": "Token de ingestao invalido."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        antenna_id = request.query_params.get("antenna_id")
        if not antenna_id:
            return Response(
                {"status": "erro", "detail": "Informe antenna_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        antenna = AntenaRFID.objects.filter(id=antenna_id).first()
        if antenna is None:
            return Response(
                {"status": "erro", "detail": "Antena nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        self.event_processor.process_ping(antenna=antenna)
        self.event_processor.deactivate_expired_antennas()
        antenna.refresh_from_db(fields=["ativa", "ativacao_expira_em", "hardware_id"])
        now = timezone.now()
        active = bool(
            antenna.ativa
            and antenna.ativacao_expira_em
            and antenna.ativacao_expira_em > now
        )
        active_for_seconds = 0
        if active:
            active_for_seconds = max(0, int((antenna.ativacao_expira_em - now).total_seconds()))

        return Response(
            {
                "status": "ok",
                "antenna_id": antenna.id,
                "hardware_id": antenna.hardware_id,
                "command": "start_reading" if active else "idle",
                "active": active,
                "active_for_seconds": active_for_seconds,
                "expires_at": antenna.ativacao_expira_em if active else None,
            },
            status=status.HTTP_200_OK,
        )


class TimelineViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimelineListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TimelineEvento.objects.select_related("item", "usuario").order_by("-criado_em")
        item_id = self.request.query_params.get("item_id")
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        only_mine = self.request.query_params.get("me")
        if only_mine in {"1", "true", "True"}:
            queryset = queryset.filter(usuario=self.request.user)
        return queryset


class InconsistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InconsistenciaListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = NotificacaoInconsistencia.objects.select_related("item").order_by("-criado_em")
        item_id = self.request.query_params.get("item_id")
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        resolvida = self.request.query_params.get("resolvida")
        if resolvida in {"true", "True", "1"}:
            queryset = queryset.filter(resolvida=True)
        elif resolvida in {"false", "False", "0"}:
            queryset = queryset.filter(resolvida=False)
        tipo = self.request.query_params.get("tipo")
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset


class AuditoriaViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    auditoria_manager = AuditoriaManager()

    @action(detail=False, methods=["post"], url_path="broadcast")
    def broadcast(self, request):
        serializer = BroadcastSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        duracao_segundos = serializer.validated_data["duracao_segundos"]
        self.auditoria_manager.finalize_expired_jobs()
        job = self.auditoria_manager.start_broadcast(
            duracao_segundos=duracao_segundos,
            requested_by=request.user,
        )
        leitores = list(
            job.leitores.select_related("antena").values(
                "antena_id",
                "antena__hardware_id",
                "antena__nome",
                "status",
            )
        )
        return Response(
            {
                "status": "broadcast_iniciado",
                "auditoria_job_id": job.id,
                "duracao_segundos": duracao_segundos,
                "iniciado_em": job.iniciado_em,
                "finaliza_em": job.finaliza_em,
                "total_antenas": len(leitores),
                "leitores": leitores,
            },
            status=status.HTTP_200_OK,
        )
