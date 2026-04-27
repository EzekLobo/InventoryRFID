from django.urls import include, path
from rest_framework.routers import DefaultRouter

from core.api.viewsets import (
    AuditoriaViewSet,
    InconsistenciaViewSet,
    MovimentacaoViewSet,
    RFIDEventosViewSet,
    TimelineViewSet,
)

router = DefaultRouter(trailing_slash=True)
router.register("movimentacao", MovimentacaoViewSet, basename="movimentacao")
router.register("eventos/rfid", RFIDEventosViewSet, basename="eventos-rfid")
router.register("timeline", TimelineViewSet, basename="timeline")
router.register("inconsistencias", InconsistenciaViewSet, basename="inconsistencias")
router.register("auditoria", AuditoriaViewSet, basename="auditoria")

urlpatterns = [
    path("", include(router.urls)),
]
