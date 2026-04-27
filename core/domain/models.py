from django.conf import settings
from django.db import models


class Local(models.Model):
    nome = models.CharField(max_length=120)
    codigo = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class AntenaRFID(models.Model):
    class TipoAntena(models.IntegerChoices):
        DESTINO = 1, "Destino"
        FLUXO = 2, "Fluxo"
        DESCARTE = 3, "Descarte"

    nome = models.CharField(max_length=120)
    hardware_id = models.CharField(max_length=100, unique=True)
    local = models.ForeignKey(Local, on_delete=models.PROTECT, related_name="antenas")
    tipo = models.IntegerField(choices=TipoAntena.choices)
    ativa = models.BooleanField(default=False)
    ultimo_acionamento = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.nome} ({self.hardware_id})"


class ItemPatrimonial(models.Model):
    tag_id = models.CharField(max_length=64, unique=True)
    nome = models.CharField(max_length=160)
    local_logico = models.ForeignKey(
        Local,
        on_delete=models.PROTECT,
        related_name="itens_logicos",
        null=True,
        blank=True,
    )
    local_fisico = models.ForeignKey(
        Local,
        on_delete=models.PROTECT,
        related_name="itens_fisicos",
        null=True,
        blank=True,
    )
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="itens_responsavel",
    )
    ativo = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nome} ({self.tag_id})"


class LeituraRFID(models.Model):
    class ClassificacaoLeitura(models.TextChoices):
        DESTINO = "destino", "Destino"
        FLUXO = "fluxo", "Fluxo"
        DESCARTE = "descarte", "Descarte"

    item = models.ForeignKey(
        ItemPatrimonial,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leituras",
    )
    tag_id = models.CharField(max_length=64)
    local = models.ForeignKey(
        Local,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leituras",
    )
    antena = models.ForeignKey(
        AntenaRFID,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leituras",
    )
    classificacao = models.CharField(max_length=20, choices=ClassificacaoLeitura.choices)
    payload = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)


class TimelineEvento(models.Model):
    class TipoEvento(models.TextChoices):
        MOVIMENTACAO = "movimentacao", "Movimentacao"
        INCONSISTENCIA = "inconsistencia", "Inconsistencia"
        RASTRO = "rastro", "Rastro"
        DESCARTE = "descarte", "Descarte"
        SISTEMA = "sistema", "Sistema"

    item = models.ForeignKey(
        ItemPatrimonial,
        on_delete=models.CASCADE,
        related_name="timeline",
        null=True,
        blank=True,
    )
    tipo = models.CharField(max_length=20, choices=TipoEvento.choices)
    mensagem = models.TextField()
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)


class NotificacaoInconsistencia(models.Model):
    item = models.ForeignKey(
        ItemPatrimonial,
        on_delete=models.CASCADE,
        related_name="inconsistencias",
    )
    local_logico = models.ForeignKey(
        Local,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="inconsistencias_logicas",
    )
    local_fisico = models.ForeignKey(
        Local,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="inconsistencias_fisicas",
    )
    resolvida = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
