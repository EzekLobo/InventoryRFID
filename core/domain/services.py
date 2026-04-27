from __future__ import annotations

from django.db import transaction

from core.domain.models import (
    AntenaRFID,
    ItemPatrimonial,
    LeituraRFID,
    NotificacaoInconsistencia,
    TimelineEvento,
)


class SyncManager:
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
        )

        inconsistencia = None
        if item.local_logico_id and item.local_logico_id != local_id:
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
            )

        return {
            "item": item,
            "leitura": leitura,
            "timeline": timeline,
            "inconsistencia": inconsistencia,
            "mudou_local": previous_local_id(previous_local) != local_id,
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
        )
        return item


def previous_local_id(local) -> int | None:
    if local is None:
        return None
    return local.id
