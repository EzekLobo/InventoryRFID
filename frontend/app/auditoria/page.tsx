"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, HelpCircle, Play, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import type {
  Antena,
  AuditoriaItemResumo,
  AuditoriaJob,
  AuditoriaMetadados,
  AuditoriaProcessada,
  ItemPatrimonial,
  TagsReadResponse
} from "@/lib/types";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import { StatCard } from "@/components/ui/StatCard";

type AuditHistoryRow = {
  id: string;
  data: string;
  local: string;
  leitor: string;
  status: "Aguardando leitura" | "Processada" | "Encerrada sem leitura";
  esperados: number | null;
  encontrados: number | null;
  naoEncontrados: number | null;
  divergentes: number | null;
  desconhecidas: number | null;
  total: number | null;
  detalhesDisponiveis: boolean;
  itensNaoEncontrados: AuditoriaItemResumo[];
  itensDivergentes: AuditoriaItemResumo[];
  tagsDesconhecidas: string[];
};

type ActiveProcess = {
  label: string;
  detail: string;
  startedAt: number;
  expiresAt: number;
};

function parseTags(value: string) {
  return value
    .split(/[\n,; ]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function numericValue(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function countLabel(value: number | null, fallback = "-") {
  return value === null ? fallback : String(value);
}

function totalFromMetadata(metadata: AuditoriaMetadados) {
  const total = numericValue(metadata.total_lidos);
  if (total !== null) return total;

  const encontrados = numericValue(metadata.encontrados);
  const divergentes = numericValue(metadata.tags_fora_do_local);
  const desconhecidas = numericValue(metadata.tags_desconhecidas);
  if (encontrados === null && divergentes === null && desconhecidas === null) return null;
  return (encontrados ?? 0) + (divergentes ?? 0) + (desconhecidas ?? 0);
}

function statusFromAudit(waiting: boolean, finalizaEm: unknown, now: number): AuditHistoryRow["status"] {
  if (!waiting) return "Processada";
  if (typeof finalizaEm === "string" && Number.isFinite(new Date(finalizaEm).getTime()) && new Date(finalizaEm).getTime() <= now) {
    return "Encerrada sem leitura";
  }
  return "Aguardando leitura";
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="help-tip" title={text}>
      <HelpCircle size={14} />
    </span>
  );
}

export default function AuditoriaPage() {
  const [antenas, setAntenas] = useState<Antena[]>([]);
  const [antennaId, setAntennaId] = useState<number | "">("");
  const [duracao, setDuracao] = useState(5);
  const [tagsText, setTagsText] = useState("");
  const [result, setResult] = useState<TagsReadResponse | null>(null);
  const [jobs, setJobs] = useState<AuditoriaJob[]>([]);
  const [processedAudits, setProcessedAudits] = useState<AuditoriaProcessada[]>([]);
  const [itens, setItens] = useState<ItemPatrimonial[]>([]);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeProcess, setActiveProcess] = useState<ActiveProcess | null>(null);
  const [finishedMessage, setFinishedMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  async function load() {
    setError("");
    try {
      const [antenasData, jobsData, processedData, itensData] = await Promise.all([
        api.listAntenas(),
        api.listAuditorias(),
        api.listAuditoriasProcessadas(),
        api.listItens()
      ]);
      setAntenas(antenasData);
      setAntennaId((current) => current || antenasData[0]?.id || "");
      setJobs(jobsData);
      setProcessedAudits(processedData);
      setItens(itensData);
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

  const expectedItems = useMemo(
    () => itens.filter((item) => item.ativo && item.local_logico_id === selectedAntenna?.local_id),
    [itens, selectedAntenna]
  );

  const auditRows = useMemo<AuditHistoryRow[]>(() => {
    const processedJobIds = new Set(
      processedAudits
        .map((audit) => Number(audit.metadados.auditoria_job_id))
        .filter((id) => Number.isFinite(id))
    );
    const processedRows = processedAudits.map((audit) => {
      const metadata = audit.metadados;
      const waiting = metadata.evento === "auditoria_iniciada";
      const localId = Number(metadata.local_id);
      const expectedInLocal = itens.filter((item) => item.ativo && item.local_logico_id === localId).length;
      const esperados = numericValue(metadata.esperados) ?? (waiting && Number.isFinite(localId) ? expectedInLocal : null);
      return {
        id: `processed-${audit.id}`,
        data: audit.criado_em,
        local: String(metadata.local_nome || "-"),
        leitor: String(metadata.antenna_nome || "-"),
        status: statusFromAudit(waiting, metadata.finaliza_em, now),
        esperados,
        encontrados: waiting ? null : numericValue(metadata.encontrados),
        naoEncontrados: waiting ? null : numericValue(metadata.nao_encontrados),
        divergentes: waiting ? null : numericValue(metadata.tags_fora_do_local),
        desconhecidas: waiting ? null : numericValue(metadata.tags_desconhecidas),
        total: waiting ? null : totalFromMetadata(metadata),
        detalhesDisponiveis: !waiting,
        itensNaoEncontrados: metadata.itens_nao_encontrados || [],
        itensDivergentes: metadata.itens_divergentes || [],
        tagsDesconhecidas: metadata.tags_desconhecidas_lista || []
      };
    });
    const jobRows = jobs
      .filter((job) => !processedJobIds.has(job.id))
      .map((job) => ({
        id: `job-${job.id}`,
        data: job.iniciado_em,
        local: uniqueValues(job.leitores.map((leitor) => leitor.local_nome)).join(", ") || "-",
        leitor: `${job.leitores.length} leitor(es)`,
        status: statusFromAudit(true, job.finaliza_em, now),
        esperados: null,
        encontrados: null,
        naoEncontrados: null,
        divergentes: null,
        desconhecidas: null,
        total: null,
        detalhesDisponiveis: false,
        itensNaoEncontrados: [],
        itensDivergentes: [],
        tagsDesconhecidas: []
      }));
    return [...processedRows, ...jobRows].sort(
      (left, right) => new Date(right.data).getTime() - new Date(left.data).getTime()
    );
  }, [itens, jobs, now, processedAudits]);

  async function startAudit() {
    if (!antennaId) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await api.auditarAntena(Number(antennaId), duracao);
      setFinishedMessage("");
      setActiveProcess({
        label: "Auditoria RFID em andamento",
        detail: "O leitor esta coletando tags para conferir o local auditado.",
        startedAt: Date.now(),
        expiresAt: new Date(response.expires_at).getTime()
      });
      await load();
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
      setFinishedMessage("Simulacao processada. Resultado atualizado na lista de auditorias.");
      if (response.status !== "ok") {
        setError("A leitura foi ignorada pelo sistema. Verifique se o leitor e a auditoria estao ativos.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar resultado da auditoria.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 300);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeProcess || now < activeProcess.expiresAt) return;

    setActiveProcess(null);
    setFinishedMessage("Auditoria RFID concluida. Dados atualizados.");
    load();
  }, [activeProcess, now]);

  const processProgress = activeProcess
    ? Math.min(100, Math.max(0, ((now - activeProcess.startedAt) / (activeProcess.expiresAt - activeProcess.startedAt)) * 100))
    : 0;
  const remainingSeconds = activeProcess ? Math.max(0, Math.ceil((activeProcess.expiresAt - now) / 1000)) : 0;

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Auditoria RFID</h1>
          <p>Acione o leitor para auditar um local. Use a simulacao apenas para testes sem leitura fisica.</p>
        </div>
        <button className="button ghost" type="button" onClick={load}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {activeProcess ? (
        <div className="process-feedback">
          <div>
            <strong>{activeProcess.label}</strong>
            <span>
              {activeProcess.detail} Termina em {remainingSeconds}s.
            </span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${processProgress}%` }} />
          </div>
        </div>
      ) : null}

      {!activeProcess && finishedMessage ? <div className="process-feedback done">{finishedMessage}</div> : null}

      {!loading ? (
        <div className="grid two">
          <article className="panel">
            <h2>
              <ShieldAlert size={21} /> Auditoria real
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
                <label htmlFor="duracao">Duracao</label>
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
                Iniciar auditoria RFID
              </button>
            </div>

            {selectedAntenna ? (
              <p>
                Local auditado: <strong>{selectedAntenna.local_nome}</strong>. O leitor fisico fica ativo pela duracao
                definida e envia as tags encontradas ao sistema. Itens esperados neste local:{" "}
                <strong>{expectedItems.length}</strong>.
                {expectedItems.length === 0 ? " Nenhum item ativo tem este local como local logico." : ""}
              </p>
            ) : null}
          </article>

          <article className="panel">
            <h2>
              <Send size={21} /> Simular leitura RFID
            </h2>
            <div className="field">
              <label htmlFor="tags">Tags simuladas</label>
              <textarea
                className="textarea"
                id="tags"
                placeholder="Cole tags de teste, uma por linha ou separadas por virgula"
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
              />
            </div>
            <p>
              Use este campo para testar a auditoria manualmente. As tags informadas serao tratadas como se tivessem
              sido lidas pelo RFID. Se deixar vazio, a simulacao considera que nenhuma tag foi encontrada.
            </p>
            <button
              className="button"
              disabled={submitting || !antennaId}
              style={{ marginTop: 12 }}
              type="button"
              onClick={sendAuditResult}
            >
              <CheckCircle2 size={17} />
              Processar simulacao
            </button>
          </article>
        </div>
      ) : null}

      {result ? (
        <div className="grid stats" style={{ marginTop: 24 }}>
          <StatCard label="Esperados" value={result.audit.esperados ?? "-"} />
          <StatCard label="Encontrados" value={result.audit.encontrados} tone="green" />
          <StatCard label="Nao encontrados" value={result.audit.nao_encontrados} tone="red" />
          <StatCard label="Divergentes" value={result.audit.tags_fora_do_local ?? 0} tone="yellow" />
          <StatCard label="Desconhecidas" value={result.audit.tags_desconhecidas} tone="yellow" />
          <StatCard label="Total" value={result.audit.total_lidos ?? totalFromMetadata(result.audit) ?? "-"} />
        </div>
      ) : null}

      <article className="panel" style={{ marginTop: 24 }}>
        <h2>Auditorias</h2>
        <div className="table-wrap">
          <table className="data-table audit-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Local</th>
                <th>Leitor</th>
                <th>Status</th>
                <th>Esperados</th>
                <th>Encontrados</th>
                <th>Nao encontrados</th>
                <th>Divergentes</th>
                <th>Desconhecidas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((audit) => (
                <Fragment key={audit.id}>
                  <tr
                    className="audit-row"
                    onClick={() => setExpandedAuditId((current) => (current === audit.id ? null : audit.id))}
                  >
                    <td>
                      <span className="audit-row-title">
                        {expandedAuditId === audit.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        {new Date(audit.data).toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td>{audit.local}</td>
                    <td>{audit.leitor}</td>
                    <td>
                      <span className={audit.status === "Processada" ? "badge green" : audit.status === "Encerrada sem leitura" ? "badge red" : "badge"}>
                        {audit.status}
                      </span>
                    </td>
                    <td>{countLabel(audit.esperados)}</td>
                    <td>{countLabel(audit.encontrados, audit.status === "Aguardando leitura" ? "Aguardando" : "-")}</td>
                    <td>{countLabel(audit.naoEncontrados, audit.status === "Aguardando leitura" ? "Aguardando" : "-")}</td>
                    <td>{countLabel(audit.divergentes, audit.status === "Aguardando leitura" ? "Aguardando" : "-")}</td>
                    <td>{countLabel(audit.desconhecidas, audit.status === "Aguardando leitura" ? "Aguardando" : "-")}</td>
                    <td>{countLabel(audit.total, audit.status === "Aguardando leitura" ? "Aguardando" : "-")}</td>
                  </tr>
                  {expandedAuditId === audit.id ? (
                    <tr className="audit-detail-row">
                      <td colSpan={10}>
                        <AuditDetail audit={audit} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {auditRows.length === 0 ? (
                <tr>
                  <td colSpan={10}>Nenhuma auditoria registrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function AuditDetail({ audit }: { audit: AuditHistoryRow }) {
  const waiting = audit.status === "Aguardando leitura";

  return (
    <div className="audit-detail">
      {!audit.detalhesDisponiveis ? (
        <div className="state-box">
          {waiting
            ? "A auditoria ainda esta aguardando uma leitura do RFID."
            : "A janela foi encerrada sem leitura processada para detalhar."}
        </div>
      ) : (
        <>
          <div className="audit-summary-grid">
            <AuditSummaryCard label="Quantidade esperada" value={audit.esperados} help="Itens ativos cujo local logico e o local auditado." />
            <AuditSummaryCard label="Quantidade encontrada" value={audit.encontrados} help="Itens esperados no local que foram lidos." />
            <AuditSummaryCard label="Nao encontrados" value={audit.naoEncontrados} help="Itens esperados no local que nao apareceram na leitura." />
            <AuditSummaryCard label="Divergentes" value={audit.divergentes} help="Itens conhecidos lidos aqui, mas cadastrados logicamente em outro local." />
            <AuditSummaryCard label="Desconhecidos" value={audit.desconhecidas} help="Tags lidas que nao existem cadastradas no inventario." />
            <AuditSummaryCard label="Quantidade total" value={audit.total} help="Total de leituras: encontrados, divergentes e desconhecidos." />
          </div>

          <div className="audit-detail-lists">
            <AuditItemList title="Nao encontrados" items={audit.itensNaoEncontrados} empty="Nenhum item esperado ficou sem leitura." />
            <AuditItemList title="Divergentes" items={audit.itensDivergentes} empty="Nenhum item de outro local foi lido nesta auditoria." />
            <UnknownTagsList tags={audit.tagsDesconhecidas} />
          </div>
        </>
      )}
    </div>
  );
}

function AuditSummaryCard({ label, value, help }: { label: string; value: number | null; help: string }) {
  return (
    <div className="audit-summary-card">
      <span>
        {label}
        <HelpTip text={help} />
      </span>
      <strong>{countLabel(value)}</strong>
    </div>
  );
}

function AuditItemList({ title, items, empty }: { title: string; items: AuditoriaItemResumo[]; empty: string }) {
  return (
    <div className="audit-list">
      <h3>{title}</h3>
      {items.length === 0 ? <p>{empty}</p> : null}
      {items.map((item) => (
        <div className="audit-list-item" key={`${title}-${item.id}-${item.tag_id}`}>
          <strong>{item.nome}</strong>
          <span>Tag: {item.tag_id}</span>
          <span>Local logico: {item.local_logico_nome || "-"}</span>
          <span>Local fisico: {item.local_fisico_nome || "-"}</span>
        </div>
      ))}
    </div>
  );
}

function UnknownTagsList({ tags }: { tags: string[] }) {
  return (
    <div className="audit-list">
      <h3>Desconhecidos</h3>
      {tags.length === 0 ? <p>Nenhuma tag desconhecida foi lida.</p> : null}
      {tags.map((tag) => (
        <div className="audit-list-item" key={tag}>
          <strong>Tag sem cadastro</strong>
          <span>{tag}</span>
        </div>
      ))}
    </div>
  );
}
