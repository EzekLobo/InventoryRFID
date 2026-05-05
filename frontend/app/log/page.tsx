"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Antena, Local, TimelineEvento } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

type LogFilters = {
  search: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  local_id: string;
  antenna_id: string;
  me: boolean;
};

const emptyFilters: LogFilters = {
  search: "",
  tipo: "",
  data_inicio: "",
  data_fim: "",
  local_id: "",
  antenna_id: "",
  me: false
};

const tipoOptions = [
  { value: "", label: "Todos" },
  { value: "movimentacao", label: "Movimentacao" },
  { value: "inconsistencia", label: "Inconsistencia" },
  { value: "rastro", label: "Rastro" },
  { value: "baixa", label: "Baixa" },
  { value: "sistema", label: "Sistema" }
];

export default function LogPage() {
  const [data, setData] = useState<TimelineEvento[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [antenas, setAntenas] = useState<Antena[]>([]);
  const [filters, setFilters] = useState<LogFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const [timelineData, locaisData, antenasData] = await Promise.all([
        api.listTimeline({
          search: nextFilters.search,
          tipo: nextFilters.tipo,
          data_inicio: nextFilters.data_inicio,
          data_fim: nextFilters.data_fim,
          local_id: nextFilters.local_id ? Number(nextFilters.local_id) : undefined,
          antenna_id: nextFilters.antenna_id ? Number(nextFilters.antenna_id) : undefined,
          me: nextFilters.me || undefined
        }),
        api.listLocais(),
        api.listAntenas()
      ]);
      setData(timelineData);
      setLocais(locaisData);
      setAntenas(antenasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o log.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(emptyFilters);
  }, []);

  const activeFilters = useMemo(
    () =>
      Object.entries(filters).filter(([, value]) => {
        if (typeof value === "boolean") return value;
        return Boolean(value);
      }).length,
    [filters]
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    load(filters);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Log operacional</h1>
          <p>Consulte eventos do sistema por item, tipo, periodo, local, leitor e usuario.</p>
        </div>
        <button className="button ghost" type="button" onClick={() => load(filters)}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      <article className="panel">
        <form className="log-filters" onSubmit={submit}>
          <label className="field">
            <span>Busca</span>
            <input
              className="input"
              placeholder="Mensagem, item ou tag"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Tipo</span>
            <select className="select" value={filters.tipo} onChange={(event) => setFilters({ ...filters, tipo: event.target.value })}>
              {tipoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Inicio</span>
            <input className="input" type="date" value={filters.data_inicio} onChange={(event) => setFilters({ ...filters, data_inicio: event.target.value })} />
          </label>

          <label className="field">
            <span>Fim</span>
            <input className="input" type="date" value={filters.data_fim} onChange={(event) => setFilters({ ...filters, data_fim: event.target.value })} />
          </label>

          <label className="field">
            <span>Local</span>
            <select className="select" value={filters.local_id} onChange={(event) => setFilters({ ...filters, local_id: event.target.value })}>
              <option value="">Todos</option>
              {locais.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Leitor</span>
            <select className="select" value={filters.antenna_id} onChange={(event) => setFilters({ ...filters, antenna_id: event.target.value })}>
              <option value="">Todos</option>
              {antenas.map((antena) => (
                <option key={antena.id} value={antena.id}>
                  {antena.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="check-field log-check">
            <input checked={filters.me} type="checkbox" onChange={(event) => setFilters({ ...filters, me: event.target.checked })} />
            <span>Somente meus eventos</span>
          </label>

          <div className="log-actions">
            <button className="button" type="submit">
              <Search size={17} />
              Filtrar
            </button>
            <button className="button ghost" type="button" onClick={resetFilters}>
              <Filter size={17} />
              Limpar
            </button>
            <span className="badge">{activeFilters} filtro(s)</span>
          </div>
        </form>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && data.length === 0 ? <EmptyState label="Nenhum evento encontrado." /> : null}

        {!loading && data.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table log-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Item</th>
                  <th>Mensagem</th>
                  <th>Detalhes</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.map((evento) => (
                  <tr key={evento.id}>
                    <td>{new Date(evento.criado_em).toLocaleString("pt-BR")}</td>
                    <td>
                      <span className="badge">{evento.tipo}</span>
                    </td>
                    <td>
                      <strong>{evento.item_nome || "-"}</strong>
                      {evento.item_tag ? <span className="log-subtext">{evento.item_tag}</span> : null}
                    </td>
                    <td>{evento.mensagem}</td>
                    <td>{metadataSummary(evento.metadados)}</td>
                    <td>{evento.usuario_nome || evento.usuario_id || "-"}</td>
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

function metadataSummary(metadata: Record<string, unknown>) {
  const keys = ["evento", "tag_id", "local_id", "antenna_id", "motivo", "tipo", "inconsistencia_id"];
  const parts = keys
    .map((key) => {
      const value = metadata[key];
      if (value === undefined || value === null || value === "") return null;
      return `${labelForMetadata(key)}: ${String(value)}`;
    })
    .filter(Boolean);
  return parts.length > 0 ? <span className="log-subtext">{parts.join(" | ")}</span> : "-";
}

function labelForMetadata(key: string) {
  const labels: Record<string, string> = {
    evento: "evento",
    tag_id: "tag",
    local_id: "local",
    antenna_id: "leitor",
    motivo: "motivo",
    tipo: "tipo",
    inconsistencia_id: "divergencia"
  };
  return labels[key] || key;
}
