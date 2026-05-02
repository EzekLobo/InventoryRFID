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
        if attrs["event_type"] == "tags_read" and not attrs.get("tags"):
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
            "local_logico_id",
            "local_fisico_id",
            "resolvida",
            "criado_em",
            "resolvida_em",
        ]


class ItemPatrimonialViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    sync_manager = SyncManager()

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

    def create(self, request):
        expected_token = getattr(settings, "RFID_INGEST_TOKEN", "")
        provided_token = request.headers.get("X-RFID-Token", "")
        if not expected_token or provided_token != expected_token:
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
            valid_tags = list(
                ItemPatrimonial.objects.filter(tag_id__in=data["tags"]).values_list("tag_id", flat=True)
            )
            if not valid_tags:
                return Response(
                    {"status": "erro", "detail": "Nenhuma tag valida enviada."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            result = self.event_processor.process_tags_read(
                antenna=antenna,
                tags=valid_tags,
                payload=data.get("payload"),
            )
        return Response(result, status=status.HTTP_201_CREATED)


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
