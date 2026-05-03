"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Play, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { Antena, AuditoriaJob, AuditoriaProcessada, TagsReadResponse } from "@/lib/types";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import { StatCard } from "@/components/ui/StatCard";

type AuditHistoryRow = {
  id: string;
  data: string;
  local: string;
  leitor: string;
  status: string;
  encontrados: string;
  naoEncontrados: string;
  desconhecidas: string;
};

function parseTags(value: string) {
  return value
    .split(/[\n,; ]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function AuditoriaPage() {
  const [antenas, setAntenas] = useState<Antena[]>([]);
  const [antennaId, setAntennaId] = useState<number | "">("");
  const [duracao, setDuracao] = useState(5);
  const [tagsText, setTagsText] = useState("");
  const [result, setResult] = useState<TagsReadResponse | null>(null);
  const [jobs, setJobs] = useState<AuditoriaJob[]>([]);
  const [processedAudits, setProcessedAudits] = useState<AuditoriaProcessada[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [antenasData, jobsData, processedData] = await Promise.all([
        api.listAntenas(),
        api.listAuditorias(),
        api.listAuditoriasProcessadas()
      ]);
      setAntenas(antenasData);
      setAntennaId((current) => current || antenasData[0]?.id || "");
      setJobs(jobsData);
      setProcessedAudits(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar auditorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedAntenna = useMemo(
    () => antenas.find((antena) => antena.id === Number(antennaId)),
    [antennaId, antenas]
  );

  const auditRows = useMemo<AuditHistoryRow[]>(() => {
    const processedJobIds = new Set(
      processedAudits
        .map((audit) => Number(audit.metadados.auditoria_job_id))
        .filter((id) => Number.isFinite(id))
    );
    const processedRows = processedAudits.map((audit) => ({
      id: `processed-${audit.id}`,
      data: audit.criado_em,
      local: String(audit.metadados.local_nome || "-"),
      leitor: String(audit.metadados.antenna_nome || "-"),
      status: audit.metadados.evento === "auditoria_iniciada" ? "Iniciada" : "Processada",
      encontrados: String(audit.metadados.encontrados ?? "-"),
      naoEncontrados: String(audit.metadados.nao_encontrados ?? "-"),
      desconhecidas: String(audit.metadados.tags_desconhecidas ?? "-")
    }));
    const jobRows = jobs
      .filter((job) => !processedJobIds.has(job.id))
      .map((job) => ({
        id: `job-${job.id}`,
        data: job.iniciado_em,
        local: uniqueValues(job.leitores.map((leitor) => leitor.local_nome)).join(", ") || "-",
        leitor: `${job.leitores.length} leitor(es)`,
        status: job.status,
        encontrados: "-",
        naoEncontrados: "-",
        desconhecidas: "-"
      }));
    return [...processedRows, ...jobRows].sort(
      (left, right) => new Date(right.data).getTime() - new Date(left.data).getTime()
    );
  }, [jobs, processedAudits]);

  async function startAudit() {
    if (!antennaId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.auditarAntena(Number(antennaId), duracao);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel iniciar auditoria.");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendAuditResult() {
    if (!antennaId) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await api.enviarTags(Number(antennaId), parseTags(tagsText), true);
      setResult(response);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar resultado da auditoria.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Auditoria RFID</h1>
          <p>Acione um leitor e envie o conjunto de tags lidas para reconciliar o local auditado.</p>
        </div>
        <button className="button ghost" type="button" onClick={load}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading ? (
        <div className="grid two">
          <article className="panel">
            <h2>
              <ShieldAlert size={21} /> Janela de auditoria
            </h2>
            <div className="form-row">
              <div className="field">
                <label htmlFor="antenna">Leitor</label>
                <select
                  className="select"
                  id="antenna"
                  value={antennaId}
                  onChange={(event) => setAntennaId(Number(event.target.value))}
                >
                  {antenas.map((antena) => (
                    <option key={antena.id} value={antena.id}>
                      {antena.nome} - {antena.local_nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="duracao">Duração</label>
                <input
                  className="input"
                  id="duracao"
                  min={1}
                  type="number"
                  value={duracao}
                  onChange={(event) => setDuracao(Number(event.target.value))}
                />
              </div>
              <button className="button yellow" disabled={submitting || !antennaId} type="button" onClick={startAudit}>
                <Play size={17} />
                Iniciar auditoria
              </button>
            </div>

            {selectedAntenna ? (
              <p>
                Local auditado: <strong>{selectedAntenna.local_nome}</strong>. Itens com esse local lógico serão
                comparados contra as tags enviadas.
              </p>
            ) : null}
          </article>

          <article className="panel">
            <h2>
              <Send size={21} /> Resultado da leitura
            </h2>
            <div className="field">
              <label htmlFor="tags">Tags lidas</label>
              <textarea
                className="textarea"
                id="tags"
                placeholder="Cole uma tag por linha ou separadas por vírgula"
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
              />
            </div>
            <button
              className="button"
              disabled={submitting || !antennaId}
              style={{ marginTop: 12 }}
              type="button"
              onClick={sendAuditResult}
            >
              <CheckCircle2 size={17} />
              Processar auditoria
            </button>
          </article>
        </div>
      ) : null}

      {result ? (
        <div className="grid stats" style={{ marginTop: 24 }}>
          <StatCard label="Esperados" value={result.audit.esperados ?? "-"} />
          <StatCard label="Encontrados" value={result.audit.encontrados} tone="green" />
          <StatCard label="Não encontrados" value={result.audit.nao_encontrados} tone="red" />
          <StatCard label="Tags desconhecidas" value={result.audit.tags_desconhecidas} tone="yellow" />
        </div>
      ) : null}

      {result ? (
        <article className="panel" style={{ marginTop: 18 }}>
          <h2>Resposta do processamento</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </article>
      ) : null}

      <article className="panel" style={{ marginTop: 24 }}>
        <h2>Auditorias</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Local</th>
                <th>Leitor</th>
                <th>Status</th>
                <th>Encontrados</th>
                <th>Nao encontrados</th>
                <th>Desconhecidas</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((audit) => (
                <tr key={audit.id}>
                  <td>{new Date(audit.data).toLocaleString("pt-BR")}</td>
                  <td>{audit.local}</td>
                  <td>{audit.leitor}</td>
                  <td>
                    <span className="badge">{audit.status}</span>
                  </td>
                  <td>{audit.encontrados}</td>
                  <td>{audit.naoEncontrados}</td>
                  <td>{audit.desconhecidas}</td>
                </tr>
              ))}
              {auditRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>Nenhuma auditoria registrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
