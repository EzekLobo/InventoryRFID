"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Play, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { Antena, AuditoriaJob, AuditoriaProcessada, TagsReadResponse } from "@/lib/types";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import { StatCard } from "@/components/ui/StatCard";

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
        <h2>Auditorias feitas</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Local</th>
                <th>Leitor</th>
                <th>Encontrados</th>
                <th>Nao encontrados</th>
                <th>Desconhecidas</th>
              </tr>
            </thead>
            <tbody>
              {processedAudits.map((audit) => (
                <tr key={audit.id}>
                  <td>{new Date(audit.criado_em).toLocaleString("pt-BR")}</td>
                  <td>{String(audit.metadados.local_nome || "-")}</td>
                  <td>{String(audit.metadados.antenna_nome || "-")}</td>
                  <td>{String(audit.metadados.encontrados ?? "-")}</td>
                  <td>{String(audit.metadados.nao_encontrados ?? "-")}</td>
                  <td>{String(audit.metadados.tags_desconhecidas ?? "-")}</td>
                </tr>
              ))}
              {processedAudits.length === 0 ? (
                <tr>
                  <td colSpan={6}>Nenhuma auditoria processada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel" style={{ marginTop: 18 }}>
        <h2>Janelas de auditoria</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Inicio</th>
                <th>Fim previsto</th>
                <th>Leitores</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>
                    <span className="badge">{job.status}</span>
                  </td>
                  <td>{new Date(job.iniciado_em).toLocaleString("pt-BR")}</td>
                  <td>{new Date(job.finaliza_em).toLocaleString("pt-BR")}</td>
                  <td>{job.leitores.map((leitor) => `${leitor.antena_nome} (${leitor.status})`).join(", ")}</td>
                </tr>
              ))}
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5}>Nenhuma janela de auditoria registrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
