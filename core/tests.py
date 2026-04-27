from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.domain.models import (
    AntenaRFID,
    ItemPatrimonial,
    LeituraRFID,
    Local,
    NotificacaoInconsistencia,
    TimelineEvento,
)
from core.middleware.rfid_handler import SensorVirtual, TopologyClassifier


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


class SyncAndApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="prof",
            email="prof@example.com",
            password="secret123",
        )
        self.lab4 = Local.objects.create(nome="Lab 4A", codigo="LAB4A")
        self.lab1 = Local.objects.create(nome="Lab 1", codigo="LAB1")
        self.item = ItemPatrimonial.objects.create(
            tag_id="TAG-OSC-001",
            nome="Osciloscopio",
            local_logico=self.lab1,
            responsavel=self.user,
        )

    def test_post_movimentacao_creates_timeline_and_inconsistency(self):
        response = self.client.post(
            "/api/movimentacao/",
            {"tag_id": self.item.tag_id, "local_id": self.lab4.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.item.refresh_from_db()
        self.assertEqual(self.item.local_fisico_id, self.lab4.id)
        self.assertTrue(
            TimelineEvento.objects.filter(
                item=self.item,
                tipo=TimelineEvento.TipoEvento.MOVIMENTACAO,
            ).exists()
        )
        self.assertTrue(NotificacaoInconsistencia.objects.filter(item=self.item).exists())

    def test_post_movimentacao_accepts_legacy_keys(self):
        response = self.client.post(
            "/api/movimentacao/",
            {"TagID": self.item.tag_id, "LocalID": self.lab4.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_post_movimentacao_returns_404_for_unknown_tag(self):
        response = self.client.post(
            "/api/movimentacao/",
            {"tag_id": "TAG-NAO-EXISTE", "local_id": self.lab4.id},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_topology_classifier_marks_item_inactive_when_disposal(self):
        antenna = AntenaRFID.objects.create(
            nome="Antenna Discard",
            hardware_id="ESP-DISC",
            local=self.lab4,
            tipo=AntenaRFID.TipoAntena.DESCARTE,
        )

        TopologyClassifier().classify_readings(antenna=antenna, tags=[self.item.tag_id])

        self.item.refresh_from_db()
        self.assertFalse(self.item.ativo)
        self.assertTrue(
            LeituraRFID.objects.filter(
                tag_id=self.item.tag_id,
                classificacao=LeituraRFID.ClassificacaoLeitura.DESCARTE,
            ).exists()
        )

    def test_auditoria_broadcast_returns_all_readers(self):
        AntenaRFID.objects.create(
            nome="Antenna 2",
            hardware_id="ESP-002",
            local=self.lab4,
            tipo=AntenaRFID.TipoAntena.FLUXO,
        )

        response = self.client.post("/api/auditoria/broadcast/", {"duracao_segundos": 8}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["duracao_segundos"], 8)
        self.assertEqual(response.data["total_antenas"], 1)
        self.assertTrue(AntenaRFID.objects.get(hardware_id="ESP-002").ativa)
