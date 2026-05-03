"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Play, Send, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { Antena, TagsReadResponse } from "@/lib/types";
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listAntenas();
        setAntenas(data);
        setAntennaId(data[0]?.id || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar antenas.");
      } finally {
        setLoading(false);
      }
    }
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
    </section>
  );
}
