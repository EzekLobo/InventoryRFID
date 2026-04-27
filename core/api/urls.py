from django.urls import include, path
from rest_framework.routers import DefaultRouter

from core.api.viewsets import AuditoriaViewSet, MovimentacaoViewSet

router = DefaultRouter(trailing_slash=True)
router.register("movimentacao", MovimentacaoViewSet, basename="movimentacao")
router.register("auditoria", AuditoriaViewSet, basename="auditoria")

urlpatterns = [
    path("", include(router.urls)),
]
