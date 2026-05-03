"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { TimelineEvento } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

export default function TimelinePage() {
  const [data, setData] = useState<TimelineEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api.listTimeline());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar timeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Timeline</h1>
          <p>Histórico de movimentações, rastros, auditorias e alertas do inventário.</p>
        </div>
        <button className="button ghost" type="button" onClick={load}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      <article className="panel">
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && data.length === 0 ? <EmptyState label="Nenhum evento registrado." /> : null}

        {!loading && data.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Mensagem</th>
                  <th>Item</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data.map((evento) => (
                  <tr key={evento.id}>
                    <td>
                      <span className="badge">{evento.tipo}</span>
                    </td>
                    <td>{evento.mensagem}</td>
                    <td>{evento.item_id || "-"}</td>
                    <td>{new Date(evento.criado_em).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
    </section>
  );
}
