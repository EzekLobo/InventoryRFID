from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from core.domain.models import (
    AntenaRFID,
    AuditoriaJob,
    AuditoriaLeitorStatus,
    ItemPatrimonial,
    LeituraRFID,
    NotificacaoInconsistencia,
    TimelineEvento,
)


class SyncManager:
    duplicate_window_seconds = 3

    @transaction.atomic
    def sync_item_location(
        self,
        *,
        tag_id: str,
        local_id: int,
        antena: AntenaRFID | None = None,
        payload: dict | None = None,
    ) -> dict:
        item = ItemPatrimonial.objects.select_for_update().get(tag_id=tag_id)
        previous_local = item.local_fisico
        duplicate = self._recent_duplicate_exists(
            tag_id=tag_id,
            local_id=local_id,
            classificacao=LeituraRFID.ClassificacaoLeitura.DESTINO,
        )
        if duplicate:
            return {
                "item": item,
                "leitura": duplicate,
                "timeline": None,
                "inconsistencia": NotificacaoInconsistencia.objects.filter(item=item, resolvida=False).first(),
                "mudou_local": False,
                "duplicada": True,
            }

        item.local_fisico_id = local_id
        item.save(update_fields=["local_fisico", "atualizado_em"])

        leitura = LeituraRFID.objects.create(
            item=item,
            tag_id=tag_id,
            local_id=local_id,
            antena=antena,
            classificacao=LeituraRFID.ClassificacaoLeitura.DESTINO,
            payload=payload or {},
        )

        mensagem = (
            f"Seu {item.nome} acaba de chegar ao "
            f"{item.local_fisico.nome if item.local_fisico else 'local desconhecido'}."
        )
        timeline = TimelineEvento.objects.create(
            item=item,
            tipo=TimelineEvento.TipoEvento.MOVIMENTACAO,
            mensagem=mensagem,
            usuario=item.responsavel,
            metadados={
                "tag_id": tag_id,
                "local_id": local_id,
                "antenna_id": antena.id if antena else None,
                "evento": "tags_read",
            },
        )

        inconsistencia = NotificacaoInconsistencia.objects.filter(item=item, resolvida=False).first()
        if item.local_logico_id and item.local_logico_id != local_id:
            if inconsistencia is None:
                inconsistencia = NotificacaoInconsistencia.objects.create(
                    item=item,
                    local_logico=item.local_logico,
                    local_fisico=item.local_fisico,
                )
                TimelineEvento.objects.create(
                    item=item,
                    tipo=TimelineEvento.TipoEvento.INCONSISTENCIA,
                    mensagem=(
                        "Inconsistencia detectada: "
                        f"local logico={item.local_logico.nome} "
                        f"vs local fisico={item.local_fisico.nome if item.local_fisico else 'desconhecido'}."
                    ),
                    usuario=item.responsavel,
                    metadados={"inconsistencia_id": inconsistencia.id},
                )
            else:
                inconsistencia.local_logico = item.local_logico
                inconsistencia.local_fisico = item.local_fisico
                inconsistencia.save(update_fields=["local_logico", "local_fisico"])
        elif inconsistencia is not None:
            NotificacaoInconsistencia.objects.filter(item=item, resolvida=False).update(
                resolvida=True,
                resolvida_em=timezone.now(),
            )
            TimelineEvento.objects.create(
                item=item,
                tipo=TimelineEvento.TipoEvento.SISTEMA,
                mensagem="Inconsistencia resolvida automaticamente por reconciliacao fisica/logica.",
                usuario=item.responsavel,
                metadados={"evento": "reconciliacao"},
            )
            inconsistencia = None

        return {
            "item": item,
            "leitura": leitura,
            "timeline": timeline,
            "inconsistencia": inconsistencia,
            "mudou_local": previous_local_id(previous_local) != local_id,
            "duplicada": False,
        }

    def register_flow_trace(
        self,
        *,
        tag_id: str,
        local_id: int,
        antena: AntenaRFID | None = None,
        payload: dict | None = None,
    ) -> LeituraRFID:
        item = ItemPatrimonial.objects.filter(tag_id=tag_id).first()
        duplicate = self._recent_duplicate_exists(
            tag_id=tag_id,
            local_id=local_id,
            classificacao=LeituraRFID.ClassificacaoLeitura.FLUXO,
        )
        if duplicate:
            return duplicate

        leitura = LeituraRFID.objects.create(
            item=item,
            tag_id=tag_id,
            local_id=local_id,
            antena=antena,
            classificacao=LeituraRFID.ClassificacaoLeitura.FLUXO,
            payload=payload or {},
        )
        TimelineEvento.objects.create(
            item=item,
            tipo=TimelineEvento.TipoEvento.RASTRO,
            mensagem=f"Rastro detectado para tag {tag_id} no local {leitura.local.nome if leitura.local else local_id}.",
            usuario=item.responsavel if item else None,
            metadados={
                "tag_id": tag_id,
                "local_id": local_id,
                "antenna_id": antena.id if antena else None,
                "evento": "flow_trace",
            },
        )
        return leitura

    @transaction.atomic
    def mark_item_inactive(
        self,
        *,
        tag_id: str,
        local_id: int | None = None,
        antena: AntenaRFID | None = None,
        payload: dict | None = None,
    ) -> ItemPatrimonial | None:
        item = ItemPatrimonial.objects.select_for_update().filter(tag_id=tag_id).first()
        duplicate = self._recent_duplicate_exists(
            tag_id=tag_id,
            local_id=local_id,
            classificacao=LeituraRFID.ClassificacaoLeitura.DESCARTE,
        )
        if duplicate:
            return item

        LeituraRFID.objects.create(
            item=item,
            tag_id=tag_id,
            local_id=local_id,
            antena=antena,
            classificacao=LeituraRFID.ClassificacaoLeitura.DESCARTE,
            payload=payload or {},
        )
        if not item:
            return None

        item.ativo = False
        if local_id:
            item.local_fisico_id = local_id
        item.save(update_fields=["ativo", "local_fisico", "atualizado_em"])
        TimelineEvento.objects.create(
            item=item,
            tipo=TimelineEvento.TipoEvento.DESCARTE,
            mensagem=f"Item {item.nome} marcado como inativo por leitura de descarte.",
            usuario=item.responsavel,
            metadados={
                "tag_id": tag_id,
                "local_id": local_id,
                "antenna_id": antena.id if antena else None,
                "evento": "discard",
            },
        )
        return item

    def _recent_duplicate_exists(self, *, tag_id: str, local_id: int | None, classificacao: str):
        window_start = timezone.now() - timedelta(seconds=self.duplicate_window_seconds)
        return (
            LeituraRFID.objects.filter(
                tag_id=tag_id,
                local_id=local_id,
                classificacao=classificacao,
                criado_em__gte=window_start,
            )
            .order_by("-criado_em")
            .first()
        )


class AuditoriaManager:
    @transaction.atomic
    def start_broadcast(self, *, duracao_segundos: int, requested_by=None) -> AuditoriaJob:
        now = timezone.now()
        finaliza_em = now + timedelta(seconds=duracao_segundos)
        job = AuditoriaJob.objects.create(
            solicitado_por=requested_by,
            duracao_segundos=duracao_segundos,
            finaliza_em=finaliza_em,
            status=AuditoriaJob.Status.INICIADO,
        )

        antenas = list(AntenaRFID.objects.all())
        for antena in antenas:
            antena.ativa = True
            antena.ultimo_acionamento = now
            antena.ativacao_expira_em = finaliza_em
            antena.save(update_fields=["ativa", "ultimo_acionamento", "ativacao_expira_em"])
            AuditoriaLeitorStatus.objects.create(
                job=job,
                antena=antena,
                status=AuditoriaLeitorStatus.Status.ENERGIZADO,
            )
        TimelineEvento.objects.create(
            item=None,
            tipo=TimelineEvento.TipoEvento.SISTEMA,
            mensagem=f"Broadcast de auditoria iniciado para {len(antenas)} leitores.",
            usuario=requested_by,
            metadados={"auditoria_job_id": job.id, "duracao_segundos": duracao_segundos},
        )
        return job

    @transaction.atomic
    def finalize_expired_jobs(self) -> int:
        now = timezone.now()
        jobs = list(
            AuditoriaJob.objects.filter(
                status=AuditoriaJob.Status.INICIADO,
                finaliza_em__lte=now,
            )
        )
        if not jobs:
            return 0

        for job in jobs:
            leitor_statuses = list(job.leitores.select_related("antena"))
            for leitor in leitor_statuses:
                leitor.antena.ativa = False
                leitor.antena.save(update_fields=["ativa"])
                leitor.status = AuditoriaLeitorStatus.Status.ENCERRADO
                leitor.save(update_fields=["status", "atualizado_em"])
            job.status = AuditoriaJob.Status.CONCLUIDO
            job.concluido_em = now
            job.save(update_fields=["status", "concluido_em"])
            TimelineEvento.objects.create(
                item=None,
                tipo=TimelineEvento.TipoEvento.SISTEMA,
                mensagem=f"Broadcast de auditoria {job.id} concluido.",
                usuario=job.solicitado_por,
                metadados={"auditoria_job_id": job.id, "evento": "auditoria_concluida"},
            )
        return len(jobs)


def previous_local_id(local) -> int | None:
    if local is None:
        return None
    return local.id
