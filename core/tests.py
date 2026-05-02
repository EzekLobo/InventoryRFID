from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.domain.models import (
    AntenaRFID,
    AuditoriaJob,
    ItemPatrimonial,
    Local,
    NotificacaoInconsistencia,
    TimelineEvento,
)
from core.middleware.rfid_handler import RFIDEventProcessor, SensorVirtual


class SensorVirtualTests(TestCase):
    def test_motion_activates_antenna_for_default_timeout(self):
        local = Local.objects.create(nome="Lab 4A", codigo="LAB4A")
        antenna = AntenaRFID.objects.create(
            nome="Antenna 1",
            hardware_id="ESP-001",
            local=local,
            tipo=AntenaRFID.TipoAntena.DESTINO,
        )
        sensor = SensorVirtual(hardware_id="IR-1")
        sensor.receive_ping()

        command = sensor.on_motion_detected(antenna=antenna)

        antenna.refresh_from_db()
        self.assertTrue(sensor.is_online)
        self.assertTrue(antenna.ativa)
        self.assertEqual(command.active_for_seconds, 5)


class PipelineAndApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="prof",
            email="prof@example.com",
            password="secret123",
        )
        self.admin = get_user_model().objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="secret123",
        )
        self.lab4 = Local.objects.create(nome="Lab 4A", codigo="LAB4A")
        self.lab1 = Local.objects.create(nome="Lab 1", codigo="LAB1")
        self.destino_antenna = AntenaRFID.objects.create(
            nome="Destino 4A",
            hardware_id="ESP-DEST-001",
            local=self.lab4,
            tipo=AntenaRFID.TipoAntena.DESTINO,
        )
        self.item = ItemPatrimonial.objects.create(
            tag_id="TAG-OSC-001",
            nome="Osciloscopio",
            local_logico=self.lab1,
            responsavel=self.user,
        )

    def _rfid_headers(self):
        return {"HTTP_X_RFID_TOKEN": settings.RFID_INGEST_TOKEN}

    def test_event_pipeline_motion_then_tags_read_updates_item_and_timeline(self):
        response_motion = self.client.post(
            "/api/eventos/rfid/",
            {"event_type": "motion_detected", "antenna_id": self.destino_antenna.id},
            format="json",
            **self._rfid_headers(),
        )
        self.assertEqual(response_motion.status_code, 201)

        response_tags = self.client.post(
            "/api/eventos/rfid/",
            {
                "event_type": "tags_read",
                "antenna_id": self.destino_antenna.id,
                "tags": [self.item.tag_id],
            },
            format="json",
            **self._rfid_headers(),
        )
        self.assertEqual(response_tags.status_code, 201)

        self.item.refresh_from_db()
        self.assertEqual(self.item.local_fisico_id, self.lab4.id)
        self.assertTrue(
            TimelineEvento.objects.filter(
                item=self.item,
                tipo=TimelineEvento.TipoEvento.MOVIMENTACAO,
            ).exists()
        )
        self.assertTrue(NotificacaoInconsistencia.objects.filter(item=self.item, resolvida=False).exists())

    def test_manual_deactivation_marks_item_inactive_and_registers_timeline(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/itens/{self.item.id}/inativar/",
            {"motivo": "baixa patrimonial"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.item.refresh_from_db()
        self.assertFalse(self.item.ativo)
        self.assertTrue(
            TimelineEvento.objects.filter(
                item=self.item,
                tipo=TimelineEvento.TipoEvento.BAIXA,
                usuario=self.user,
                metadados__motivo="baixa patrimonial",
            ).exists()
        )

    def test_inconsistency_is_deduplicated_and_resolved_after_reconciliation(self):
        processor = RFIDEventProcessor()
        processor.process_motion_detected(antenna=self.destino_antenna)
        processor.process_tags_read(antenna=self.destino_antenna, tags=[self.item.tag_id])
        processor.process_tags_read(antenna=self.destino_antenna, tags=[self.item.tag_id])
        self.assertEqual(NotificacaoInconsistencia.objects.filter(item=self.item, resolvida=False).count(), 1)

        self.destino_antenna.local = self.lab1
        self.destino_antenna.save(update_fields=["local"])
        processor.process_motion_detected(antenna=self.destino_antenna)
        processor.process_tags_read(antenna=self.destino_antenna, tags=[self.item.tag_id])

        self.assertEqual(NotificacaoInconsistencia.objects.filter(item=self.item, resolvida=False).count(), 0)
        self.assertTrue(NotificacaoInconsistencia.objects.filter(item=self.item, resolvida=True).exists())

    def test_timeline_endpoint_filters_me(self):
        self.client.force_authenticate(user=self.user)
        TimelineEvento.objects.create(
            item=self.item,
            tipo=TimelineEvento.TipoEvento.SISTEMA,
            mensagem="Teste",
            usuario=self.user,
        )
        response = self.client.get("/api/timeline/?me=true")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_inconsistencias_endpoint_requires_auth_and_filters(self):
        NotificacaoInconsistencia.objects.create(
            item=self.item,
            local_logico=self.lab1,
            local_fisico=self.lab4,
            resolvida=False,
        )
        response_no_auth = self.client.get("/api/inconsistencias/")
        self.assertEqual(response_no_auth.status_code, 403)

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/inconsistencias/?resolvida=false")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_broadcast_requires_admin(self):
        self.client.force_authenticate(user=self.user)
        forbidden = self.client.post("/api/auditoria/broadcast/", {"duracao_segundos": 8}, format="json")
        self.assertEqual(forbidden.status_code, 403)

        self.client.force_authenticate(user=self.admin)
        success = self.client.post("/api/auditoria/broadcast/", {"duracao_segundos": 8}, format="json")
        self.assertEqual(success.status_code, 200)
        self.assertTrue(AuditoriaJob.objects.filter(id=success.data["auditoria_job_id"]).exists())

    def test_movimentacao_alias_uses_topology_pipeline(self):
        self.client.force_authenticate(user=self.user)
        self.destino_antenna.ativa = True
        self.destino_antenna.save(update_fields=["ativa"])
        response = self.client.post(
            "/api/movimentacao/",
            {"TagID": self.item.tag_id, "AntennaID": self.destino_antenna.id},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["event"], "tags_read")
