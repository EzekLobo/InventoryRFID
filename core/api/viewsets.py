from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from core.domain.models import AntenaRFID, ItemPatrimonial
from core.domain.services import SyncManager


class MovimentacaoSerializer(serializers.Serializer):
    tag_id = serializers.CharField(max_length=64)
    local_id = serializers.IntegerField(min_value=1)
    antenna_id = serializers.IntegerField(required=False, allow_null=True)
    payload = serializers.JSONField(required=False)


class BroadcastSerializer(serializers.Serializer):
    duracao_segundos = serializers.IntegerField(required=False, min_value=1, default=5)


class MovimentacaoViewSet(viewsets.ViewSet):
    sync_manager = SyncManager()

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

        antenna = None
        antenna_id = data.get("antenna_id")
        if antenna_id:
            antenna = AntenaRFID.objects.filter(id=antenna_id).first()

        result = self.sync_manager.sync_item_location(
            tag_id=data["tag_id"],
            local_id=data["local_id"],
            antena=antenna,
            payload=data.get("payload"),
        )
        return Response(
            {
                "status": "ok",
                "item_id": result["item"].id,
                "timeline_id": result["timeline"].id,
                "inconsistencia": bool(result["inconsistencia"]),
            },
            status=status.HTTP_201_CREATED,
        )


class AuditoriaViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["post"], url_path="broadcast")
    def broadcast(self, request):
        serializer = BroadcastSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        duracao_segundos = serializer.validated_data["duracao_segundos"]
        now = timezone.now()
        AntenaRFID.objects.update(ativa=True, ultimo_acionamento=now)

        antenas = list(
            AntenaRFID.objects.values("id", "hardware_id", "nome", "local_id", "tipo")
        )
        return Response(
            {
                "status": "broadcast_iniciado",
                "duracao_segundos": duracao_segundos,
                "antenas_energizadas": antenas,
                "total_antenas": len(antenas),
            },
            status=status.HTTP_200_OK,
        )
