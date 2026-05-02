from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.utils import timezone

from core.domain.models import AntenaRFID, LeituraRFID
from core.domain.services import AuditoriaManager, SyncManager


@dataclass
class ActivationCommand:
    hardware_id: str
    active_for_seconds: int
    expires_at: str


class SensorVirtual:
    """
    Encapsula o sensor físico e mantém estado operacional via pings/interrupções.
    """

    def __init__(self, *, hardware_id: str, antenna_timeout_seconds: int = 5):
        self.hardware_id = hardware_id
        self.antenna_timeout_seconds = antenna_timeout_seconds
        self.is_online = False
        self.last_ping_at = None

    def receive_ping(self) -> None:
        self.last_ping_at = timezone.now()
        self.is_online = True

    def mark_offline_if_stale(self, *, stale_after_seconds: int = 15) -> bool:
        if not self.last_ping_at:
            self.is_online = False
            return self.is_online
        self.is_online = timezone.now() - self.last_ping_at <= timedelta(seconds=stale_after_seconds)
        return self.is_online

    def on_motion_detected(self, *, antenna: AntenaRFID) -> ActivationCommand:
        now = timezone.now()
        antenna.ativa = True
        antenna.ultimo_acionamento = now
        antenna.save(update_fields=["ativa", "ultimo_acionamento"])
        return ActivationCommand(
            hardware_id=antenna.hardware_id,
            active_for_seconds=self.antenna_timeout_seconds,
            expires_at=(now + timedelta(seconds=self.antenna_timeout_seconds)).isoformat(),
        )


class TopologyClassifier:
    def __init__(self, sync_manager: SyncManager | None = None):
        self.sync_manager = sync_manager or SyncManager()

    def classify_readings(
        self,
        *,
        antenna: AntenaRFID,
        tags: list[str],
        payload: dict | None = None,
    ) -> dict:
        processados = {"destino": 0, "fluxo": 0}
        for tag_id in tags:
            if antenna.tipo == AntenaRFID.TipoAntena.DESTINO:
                self.sync_manager.sync_item_location(
                    tag_id=tag_id,
                    local_id=antenna.local_id,
                    antena=antenna,
                    payload=payload,
                )
                processados["destino"] += 1
            elif antenna.tipo == AntenaRFID.TipoAntena.FLUXO:
                self.sync_manager.register_flow_trace(
                    tag_id=tag_id,
                    local_id=antenna.local_id,
                    antena=antenna,
                    payload=payload,
                )
                processados["fluxo"] += 1
            else:
                LeituraRFID.objects.create(
                    tag_id=tag_id,
                    local_id=antenna.local_id,
                    antena=antenna,
                    classificacao=LeituraRFID.ClassificacaoLeitura.FLUXO,
                    payload={"warning": "tipo_antena_desconhecido", **(payload or {})},
                )
        return processados


class RFIDEventProcessor:
    def __init__(self):
        self.sync_manager = SyncManager()
        self.classifier = TopologyClassifier(sync_manager=self.sync_manager)
        self.auditoria_manager = AuditoriaManager()

    def process_ping(self, *, antenna: AntenaRFID) -> dict:
        now = timezone.now()
        antenna.ultimo_ping = now
        antenna.online = True
        antenna.save(update_fields=["ultimo_ping", "online"])
        return {"status": "ok", "event": "ping", "antenna_id": antenna.id}

    def process_motion_detected(self, *, antenna: AntenaRFID) -> dict:
        sensor = SensorVirtual(hardware_id=antenna.hardware_id)
        command = sensor.on_motion_detected(antenna=antenna)
        antenna.ativacao_expira_em = timezone.now() + timedelta(seconds=command.active_for_seconds)
        antenna.save(update_fields=["ativacao_expira_em"])
        return {
            "status": "ok",
            "event": "motion_detected",
            "command": {
                "hardware_id": command.hardware_id,
                "active_for_seconds": command.active_for_seconds,
                "expires_at": command.expires_at,
            },
        }

    def process_tags_read(self, *, antenna: AntenaRFID, tags: list[str], payload: dict | None = None) -> dict:
        self.deactivate_expired_antennas()
        antenna.refresh_from_db(fields=["ativa", "ativacao_expira_em"])
        if (not antenna.ativa) or (
            antenna.ativacao_expira_em and antenna.ativacao_expira_em <= timezone.now()
        ):
            return {"status": "ignored", "reason": "antenna_window_closed", "event": "tags_read"}
        result = self.classifier.classify_readings(antenna=antenna, tags=tags, payload=payload)
        return {"status": "ok", "event": "tags_read", "processed": result}

    def deactivate_expired_antennas(self) -> int:
        now = timezone.now()
        expired = AntenaRFID.objects.filter(ativa=True, ativacao_expira_em__isnull=False, ativacao_expira_em__lte=now)
        updated = expired.update(ativa=False)
        self.auditoria_manager.finalize_expired_jobs()
        return updated
