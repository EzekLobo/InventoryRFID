"use client";

import { useEffect, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Inconsistencia } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

const labels: Record<string, string> = {
  local_divergente: "Local divergente",
  nao_encontrado: "Não encontrado",
  tag_desconhecida: "Tag desconhecida"
};

export default function InconsistenciasPage() {
  const [data, setData] = useState<Inconsistencia[]>([]);
  const [tipo, setTipo] = useState("");
  const [resolvida, setResolvida] = useState("false");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api.listInconsistencias(resolvida, tipo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar divergencias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tipo, resolvida]);

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Divergências</h1>
          <p>Acompanhe itens fora do local esperado, não encontrados e tags desconhecidas.</p>
        </div>
      </div>

      <article className="panel">
        <div className="toolbar">
          <div className="form-row">
            <div className="field">
              <label htmlFor="tipo">
                <Filter size={14} /> Tipo
              </label>
              <select className="select" id="tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                <option value="">Todos</option>
                <option value="local_divergente">Local divergente</option>
                <option value="nao_encontrado">Não encontrado</option>
                <option value="tag_desconhecida">Tag desconhecida</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="resolvida">Situação</label>
              <select
                className="select"
                id="resolvida"
                value={resolvida}
                onChange={(event) => setResolvida(event.target.value)}
              >
                <option value="false">Abertas</option>
                <option value="true">Resolvidas</option>
                <option value="">Todas</option>
              </select>
            </div>
          </div>
          <button className="button ghost" type="button" onClick={load}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && data.length === 0 ? <EmptyState label="Nenhuma divergência encontrada." /> : null}

        {!loading && data.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Item</th>
                  <th>Tag</th>
                  <th>Local lógico</th>
                  <th>Local físico</th>
                  <th>Situação</th>
                  <th>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>{labels[item.tipo] || item.tipo}</td>
                    <td>{item.item_id || "-"}</td>
                    <td>{item.tag_id || "-"}</td>
                    <td>{item.local_logico_id || "-"}</td>
                    <td>{item.local_fisico_id || "-"}</td>
                    <td>
                      <span className={item.resolvida ? "badge green" : "badge red"}>
                        {item.resolvida ? "Resolvida" : "Aberta"}
                      </span>
                    </td>
                    <td>{new Date(item.criado_em).toLocaleString("pt-BR")}</td>
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
