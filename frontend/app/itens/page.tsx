"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, History, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { ItemPatrimonial, TimelineEvento } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

export default function ItensPage() {
  const [itens, setItens] = useState<ItemPatrimonial[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [timelineByItem, setTimelineByItem] = useState<Record<number, TimelineEvento[]>>({});
  const [timelineLoadingId, setTimelineLoadingId] = useState<number | null>(null);
  const [timelineError, setTimelineError] = useState("");
  const [error, setError] = useState("");

  async function load(term = search) {
    setLoading(true);
    setError("");
    try {
      setItens(await api.listItens(term));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar itens.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTimeline(item: ItemPatrimonial) {
    const nextId = expandedItemId === item.id ? null : item.id;
    setExpandedItemId(nextId);
    setTimelineError("");
    if (!nextId || timelineByItem[item.id]) return;

    setTimelineLoadingId(item.id);
    try {
      const timeline = await api.listTimeline(item.id);
      setTimelineByItem((current) => ({ ...current, [item.id]: timeline }));
    } catch (err) {
      setTimelineError(err instanceof Error ? err.message : "Nao foi possivel carregar historico do item.");
    } finally {
      setTimelineLoadingId(null);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Patrimonio</h1>
          <p>Consulte itens por nome ou tag e confira local logico versus local fisico.</p>
        </div>
      </div>

      <article className="panel">
        <form
          className="toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            load(search);
          }}
        >
          <div className="field">
            <label htmlFor="search">Busca</label>
            <input
              className="input"
              id="search"
              placeholder="Nome ou tag"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="button" type="submit">
            <Search size={17} />
            Buscar
          </button>
        </form>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && itens.length === 0 ? <EmptyState label="Nenhum item encontrado." /> : null}

        {!loading && itens.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Tag</th>
                  <th>Local logico</th>
                  <th>Local fisico</th>
                  <th>Responsavel</th>
                  <th>Status</th>
                  <th>Historico</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <Fragment key={item.id}>
                    <tr>
                      <td>{item.nome}</td>
                      <td>{item.tag_id}</td>
                      <td>{item.local_logico_nome || "-"}</td>
                      <td>{item.local_fisico_nome || "-"}</td>
                      <td>{item.responsavel_nome || "-"}</td>
                      <td>
                        <span className={item.ativo ? "badge green" : "badge red"}>
                          {item.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <button className="button ghost history-button" type="button" onClick={() => toggleTimeline(item)}>
                          {expandedItemId === item.id ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                          Historico
                        </button>
                      </td>
                    </tr>
                    {expandedItemId === item.id ? (
                      <tr className="item-timeline-row">
                        <td colSpan={7}>
                          <ItemTimeline
                            error={timelineError}
                            events={timelineByItem[item.id] || []}
                            item={item}
                            loading={timelineLoadingId === item.id}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
    </section>
  );
}

function ItemTimeline({
  error,
  events,
  item,
  loading
}: {
  error: string;
  events: TimelineEvento[];
  item: ItemPatrimonial;
  loading: boolean;
}) {
  return (
    <div className="item-timeline">
      <div className="item-timeline-head">
        <div>
          <strong>
            <History size={17} /> Historico de {item.nome}
          </strong>
          <span>
            Tag {item.tag_id} | logico: {item.local_logico_nome || "-"} | fisico: {item.local_fisico_nome || "-"}
          </span>
        </div>
      </div>

      {loading ? <LoadingState label="Carregando historico do item" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && events.length === 0 ? <EmptyState label="Nenhum evento registrado para este item." /> : null}

      {!loading && !error && events.length > 0 ? (
        <div className="item-timeline-list">
          {events.map((event) => (
            <div className="item-timeline-event" key={event.id}>
              <span className="badge">{event.tipo}</span>
              <div>
                <strong>{event.mensagem}</strong>
                <span>{new Date(event.criado_em).toLocaleString("pt-BR")}</span>
                <small>{metadataSummary(event.metadados) || "Sem metadados relevantes."}</small>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function metadataSummary(metadata: Record<string, unknown>) {
  const labels: Record<string, string> = {
    evento: "evento",
    tag_id: "tag",
    local_id: "local",
    antenna_id: "leitor",
    motivo: "motivo",
    tipo: "tipo",
    inconsistencia_id: "divergencia"
  };
  return Object.keys(labels)
    .map((key) => {
      const value = metadata[key];
      if (value === undefined || value === null || value === "") return null;
      return `${labels[key]}: ${String(value)}`;
    })
    .filter(Boolean)
    .join(" | ");
}
