"use client";

import { useEffect, useState } from "react";
import { Play, Radar, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { AcionamentoResponse, Antena } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

export default function AntenasPage() {
  const [antenas, setAntenas] = useState<Antena[]>([]);
  const [duracao, setDuracao] = useState(5);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [lastCommand, setLastCommand] = useState<AcionamentoResponse | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setAntenas(await api.listAntenas());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar leitores.");
    } finally {
      setLoading(false);
    }
  }

  async function acionar(id: number, audit = false) {
    setBusyId(id);
    setError("");
    try {
      const response = audit ? await api.auditarAntena(id, duracao) : await api.ativarAntena(id, duracao);
      setLastCommand(response);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao acionar leitor.");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Leitores RFID</h1>
          <p>Acione janelas de leitura e acompanhe o status das antenas cadastradas.</p>
        </div>
        <button className="button ghost" type="button" onClick={load}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="field">
            <label htmlFor="duracao">Duração da janela</label>
            <input
              className="input"
              id="duracao"
              min={1}
              type="number"
              value={duracao}
              onChange={(event) => setDuracao(Number(event.target.value))}
            />
          </div>
          {lastCommand ? (
            <span className="badge green">
              {lastCommand.status} até {new Date(lastCommand.expires_at).toLocaleTimeString("pt-BR")}
            </span>
          ) : null}
        </div>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && antenas.length === 0 ? <EmptyState label="Nenhum leitor cadastrado." /> : null}

        {!loading && antenas.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leitor</th>
                  <th>Local</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Último ping</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {antenas.map((antena) => (
                  <tr key={antena.id}>
                    <td>
                      <strong>{antena.nome}</strong>
                      <br />
                      <small>{antena.hardware_id}</small>
                    </td>
                    <td>{antena.local_nome}</td>
                    <td>{antena.tipo_display}</td>
                    <td>
                      <span className={antena.online ? "badge green" : "badge red"}>
                        {antena.online ? "Online" : "Offline"}
                      </span>{" "}
                      {antena.ativa ? <span className="badge">Ativa</span> : null}
                    </td>
                    <td>{antena.ultimo_ping ? new Date(antena.ultimo_ping).toLocaleString("pt-BR") : "-"}</td>
                    <td>
                      <div className="form-row">
                        <button
                          className="button"
                          disabled={busyId === antena.id}
                          type="button"
                          onClick={() => acionar(antena.id)}
                        >
                          <Play size={17} />
                          Ler
                        </button>
                        <button
                          className="button yellow"
                          disabled={busyId === antena.id}
                          type="button"
                          onClick={() => acionar(antena.id, true)}
                        >
                          <Radar size={17} />
                          Auditar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
