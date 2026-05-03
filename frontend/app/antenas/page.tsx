"use client";

import { useEffect, useState } from "react";
import { Play, Radar, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { AcionamentoResponse, Antena } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

function commandLabel(command: AcionamentoResponse) {
  const action = command.status === "auditoria_iniciada" ? "Auditoria iniciada" : "Sincronizacao iniciada";
  return `${action} ate ${new Date(command.expires_at).toLocaleTimeString("pt-BR")}`;
}

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
          <p>Acione janelas de sincronizacao e acompanhe o status das antenas cadastradas.</p>
        </div>
        <button className="button ghost" type="button" onClick={load}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="field">
            <label htmlFor="duracao">Duracao da janela</label>
            <input
              className="input"
              id="duracao"
              min={1}
              type="number"
              value={duracao}
              onChange={(event) => setDuracao(Number(event.target.value))}
            />
          </div>
          {lastCommand ? <span className="badge green">{commandLabel(lastCommand)}</span> : null}
        </div>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && antenas.length === 0 ? <EmptyState label="Nenhum leitor cadastrado." /> : null}

        {!loading && antenas.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table readers-table">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Leitor</th>
                  <th>Local</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ultimo ping</th>
                  <th>Acoes</th>
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
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="button action-button"
                          disabled={!antena.online || busyId === antena.id}
                          title={antena.online ? "Abrir janela de sincronizacao" : "Leitor offline"}
                          type="button"
                          onClick={() => acionar(antena.id)}
                        >
                          <Play size={17} />
                          Sincronizar
                        </button>
                        <button
                          className="button yellow action-button"
                          disabled={!antena.online || busyId === antena.id}
                          title={antena.online ? "Abrir auditoria do local" : "Leitor offline"}
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
