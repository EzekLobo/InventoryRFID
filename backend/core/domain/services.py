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
                "inconsistencia": NotificacaoInconsistencia.objects.filter(
                    item=item,
                    tipo=NotificacaoInconsistencia.TipoInconsistencia.LOCAL_DIVERGENTE,
                    resolvida=False,
                ).first(),
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

        inconsistencia = NotificacaoInconsistencia.objects.filter(
            item=item,
            tipo=NotificacaoInconsistencia.TipoInconsistencia.LOCAL_DIVERGENTE,
            resolvida=False,
        ).first()
        if item.local_logico_id and item.local_logico_id != local_id:
            if inconsistencia is None:
                inconsistencia = NotificacaoInconsistencia.objects.create(
                    item=item,
                    tipo=NotificacaoInconsistencia.TipoInconsistencia.LOCAL_DIVERGENTE,
                    tag_id=tag_id,
                    local_logico=item.local_logico,
                    local_fisico=item.local_fisico,
                    metadados={
                        "tag_id": tag_id,
                        "local_id": local_id,
                        "antenna_id": antena.id if antena else None,
                        "evento": "local_divergente",
                    },
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
                    metadados={
                        "inconsistencia_id": inconsistencia.id,
                        "tipo": inconsistencia.tipo,
                    },
                )
            else:
                inconsistencia.local_logico = item.local_logico
                inconsistencia.local_fisico = item.local_fisico
                inconsistencia.tag_id = tag_id
                inconsistencia.metadados = {
                    **(inconsistencia.metadados or {}),
                    "tag_id": tag_id,
                    "local_id": local_id,
                    "antenna_id": antena.id if antena else None,
                    "evento": "local_divergente",
                }
                inconsistencia.save(update_fields=["local_logico", "local_fisico", "tag_id", "metadados"])
        elif inconsistencia is not None:
            NotificacaoInconsistencia.objects.filter(
                item=item,
                tipo=NotificacaoInconsistencia.TipoInconsistencia.LOCAL_DIVERGENTE,
                resolvida=False,
            ).update(
                resolvida=True,
                resolvida_em=timezone.now(),
            )
            TimelineEvento.objects.create(
                item=item,
                tipo=TimelineEvento.TipoEvento.SISTEMA,
                mensagem="Inconsistencia resolvida automaticamente por reconciliacao fisica/logica.",
                usuario=item.responsavel,
                metadados={"evento": "reconciliacao", "tipo": inconsistencia.tipo},
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
    def deactivate_item_manually(
        self,
        *,
        item_id: int,
        motivo: str,
        usuario=None,
    ) -> ItemPatrimonial:
        item = ItemPatrimonial.objects.select_for_update().get(id=item_id)
        was_active = item.ativo
        if item.ativo:
            item.ativo = False
            item.save(update_fields=["ativo", "atualizado_em"])

        TimelineEvento.objects.create(
            item=item,
            tipo=TimelineEvento.TipoEvento.BAIXA,
            mensagem=f"Item marcado como inativo por usuario {usuario_label(usuario)}. Motivo: {motivo}",
            usuario=usuario,
            metadados={
                "item_id": item.id,
                "tag_id": item.tag_id,
                "motivo": motivo,
                "evento": "baixa_manual",
                "ja_estava_inativo": not was_active,
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


class AuditoriaReconciliacaoManager:
    def is_audit_payload(self, payload: dict | None) -> bool:
        payload = payload or {}
        return bool(payload.get("audit") or payload.get("auditoria_job_id"))

    @transaction.atomic
    def reconcile_destination_reading(
        self,
        *,
        antenna: AntenaRFID,
        raw_tags: list[str],
        valid_tags: list[str],
        payload: dict | None = None,
    ) -> dict:
        if antenna.tipo != AntenaRFID.TipoAntena.DESTINO or not self.is_audit_payload(payload):
            return {
                "audit": False,
                "encontrados": len(valid_tags),
                "nao_encontrados": 0,
                "tags_desconhecidas": 0,
            }

        payload = payload or {}
        raw_tag_set = set(raw_tags)
        valid_tag_set = set(valid_tags)
        unknown_tags = sorted(raw_tag_set - valid_tag_set)

        expected_items = list(
            ItemPatrimonial.objects.filter(
                ativo=True,
                local_logico_id=antenna.local_id,
            ).select_related("local_logico", "local_fisico", "responsavel")
        )
        expected_by_tag = {item.tag_id: item for item in expected_items}
        missing_items = [item for item in expected_items if item.tag_id not in valid_tag_set]
        found_expected_items = [item for tag, item in expected_by_tag.items() if tag in valid_tag_set]

        for item in missing_items:
            self._mark_missing(item=item, antenna=antenna, payload=payload)

        for item in found_expected_items:
            self._resolve_missing(item=item, antenna=antenna, payload=payload)

        for tag_id in unknown_tags:
            self._mark_unknown_tag(tag_id=tag_id, antenna=antenna, payload=payload)

        auditoria = {
            "audit": True,
            "esperados": len(expected_items),
            "encontrados": len(found_expected_items),
            "nao_encontrados": len(missing_items),
            "tags_desconhecidas": len(unknown_tags),
            "tags_fora_do_local": len(valid_tag_set - set(expected_by_tag.keys())),
        }
        TimelineEvento.objects.create(
            item=None,
            tipo=TimelineEvento.TipoEvento.SISTEMA,
            mensagem=f"Auditoria realizada em {antenna.local.nome} pela antena {antenna.nome}.",
            usuario=None,
            metadados={
                "evento": "auditoria_processada",
                "antenna_id": antenna.id,
                "antenna_nome": antenna.nome,
                "local_id": antenna.local_id,
                "local_nome": antenna.local.nome,
                "tags_lidas": len(raw_tag_set),
                **auditoria,
                **payload,
            },
        )
        return {
            **auditoria,
        }

    def _mark_missing(self, *, item: ItemPatrimonial, antenna: AntenaRFID, payload: dict) -> None:
        inconsistencia = NotificacaoInconsistencia.objects.filter(
            item=item,
            tipo=NotificacaoInconsistencia.TipoInconsistencia.NAO_ENCONTRADO,
            resolvida=False,
        ).first()
        metadados = {
            "tag_id": item.tag_id,
            "local_id": antenna.local_id,
            "antenna_id": antenna.id,
            "evento": "item_nao_encontrado",
            **payload,
        }
        if inconsistencia:
            inconsistencia.local_logico = item.local_logico
            inconsistencia.local_fisico = item.local_fisico
            inconsistencia.tag_id = item.tag_id
            inconsistencia.metadados = metadados
            inconsistencia.save(update_fields=["local_logico", "local_fisico", "tag_id", "metadados"])
            return

        inconsistencia = NotificacaoInconsistencia.objects.create(
            item=item,
            tipo=NotificacaoInconsistencia.TipoInconsistencia.NAO_ENCONTRADO,
            tag_id=item.tag_id,
            local_logico=item.local_logico,
            local_fisico=item.local_fisico,
            metadados=metadados,
        )
        TimelineEvento.objects.create(
            item=item,
            tipo=TimelineEvento.TipoEvento.INCONSISTENCIA,
            mensagem=(
                f"Item esperado em {antenna.local.nome} nao foi encontrado "
                f"na leitura da antena {antenna.nome}."
            ),
            usuario=item.responsavel,
            metadados={
                "inconsistencia_id": inconsistencia.id,
                "tipo": inconsistencia.tipo,
                **metadados,
            },
        )

    def _resolve_missing(self, *, item: ItemPatrimonial, antenna: AntenaRFID, payload: dict) -> None:
        inconsistencias = list(
            NotificacaoInconsistencia.objects.filter(
                item=item,
                tipo=NotificacaoInconsistencia.TipoInconsistencia.NAO_ENCONTRADO,
                resolvida=False,
            )
        )
        if not inconsistencias:
            return

        now = timezone.now()
        ids = [inconsistencia.id for inconsistencia in inconsistencias]
        NotificacaoInconsistencia.objects.filter(id__in=ids).update(resolvida=True, resolvida_em=now)
        TimelineEvento.objects.create(
            item=item,
            tipo=TimelineEvento.TipoEvento.SISTEMA,
            mensagem=f"Item {item.nome} encontrado novamente em auditoria da antena {antenna.nome}.",
            usuario=item.responsavel,
            metadados={
                "evento": "item_reencontrado",
                "tipo": NotificacaoInconsistencia.TipoInconsistencia.NAO_ENCONTRADO,
                "inconsistencia_ids": ids,
                "antenna_id": antenna.id,
                "local_id": antenna.local_id,
                **payload,
            },
        )

    def _mark_unknown_tag(self, *, tag_id: str, antenna: AntenaRFID, payload: dict) -> None:
        inconsistencia = NotificacaoInconsistencia.objects.filter(
            tipo=NotificacaoInconsistencia.TipoInconsistencia.TAG_DESCONHECIDA,
            tag_id=tag_id,
            local_fisico=antenna.local,
            resolvida=False,
        ).first()
        metadados = {
            "tag_id": tag_id,
            "local_id": antenna.local_id,
            "antenna_id": antenna.id,
            "evento": "tag_desconhecida",
            **payload,
        }
        if inconsistencia:
            inconsistencia.metadados = metadados
            inconsistencia.save(update_fields=["metadados"])
            return

        inconsistencia = NotificacaoInconsistencia.objects.create(
            item=None,
            tipo=NotificacaoInconsistencia.TipoInconsistencia.TAG_DESCONHECIDA,
            tag_id=tag_id,
            local_logico=None,
            local_fisico=antenna.local,
            metadados=metadados,
        )
        TimelineEvento.objects.create(
            item=None,
            tipo=TimelineEvento.TipoEvento.INCONSISTENCIA,
            mensagem=f"Tag RFID desconhecida {tag_id} lida na antena {antenna.nome}.",
            usuario=None,
            metadados={
                "inconsistencia_id": inconsistencia.id,
                "tipo": inconsistencia.tipo,
                **metadados,
            },
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


def usuario_label(usuario) -> str:
    if not usuario:
        return "desconhecido"
    return getattr(usuario, "get_username", lambda: str(usuario))()
