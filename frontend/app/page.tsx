"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Antenna, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Antena, Inconsistencia, ItemPatrimonial, TimelineEvento } from "@/lib/types";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import { StatCard } from "@/components/ui/StatCard";

export default function HomePage() {
  const [antenas, setAntenas] = useState<Antena[]>([]);
  const [itens, setItens] = useState<ItemPatrimonial[]>([]);
  const [inconsistencias, setInconsistencias] = useState<Inconsistencia[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [antenasData, itensData, inconsistenciasData, timelineData] = await Promise.all([
        api.listAntenas(),
        api.listItens(),
        api.listInconsistencias("false"),
        api.listTimeline()
      ]);
      setAntenas(antenasData);
      setItens(itensData);
      setInconsistencias(inconsistenciasData);
      setTimeline(timelineData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      leitoresOnline: antenas.filter((antena) => antena.online).length,
      leitoresAtivos: antenas.filter((antena) => antena.ativa).length,
      itensAtivos: itens.filter((item) => item.ativo).length,
      divergencias: inconsistencias.length
    }),
    [antenas, inconsistencias, itens]
  );

  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Controle patrimonial inteligente</span>
          <h1>
            Inventário <br />
            RFID COLCIC
          </h1>
          <p>
            Gerencie leitores, acione janelas de leitura, execute auditorias e acompanhe divergências entre
            inventário lógico e físico.
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <img className="hero-image" src="/assets/hero-inventario.png" alt="" />
        </div>
      </section>

      <section className="content-band">
        {loading ? <LoadingState label="Carregando painel operacional" /> : null}
        {error ? <ErrorState message={error} /> : null}

        {!loading && !error ? (
          <>
            <div className="grid stats">
              <StatCard label="Leitores online" value={stats.leitoresOnline} tone="green" />
              <StatCard label="Leitores ativos" value={stats.leitoresAtivos} />
              <StatCard label="Itens ativos" value={stats.itensAtivos} tone="yellow" />
              <StatCard label="Divergências abertas" value={stats.divergencias} tone="red" />
            </div>

            <div className="content-band" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div className="section-head">
                <div>
                  <h2>Operação</h2>
                  <p>Atalhos e situação recente do sistema.</p>
                </div>
                <button className="button ghost" type="button" onClick={load}>
                  <RefreshCw size={18} />
                  Atualizar
                </button>
              </div>

              <div className="grid two">
                <article className="panel">
                  <h3>
                    <Antenna size={20} /> Leitores
                  </h3>
                  <div className="table-wrap">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: "34%" }} />
                        <col style={{ width: "46%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Local</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {antenas.slice(0, 5).map((antena) => (
                          <tr key={antena.id}>
                            <td>{antena.nome}</td>
                            <td>{antena.local_nome}</td>
                            <td>
                              <span className={antena.online ? "badge green" : "badge red"}>
                                {antena.online ? "Online" : "Offline"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel">
                  <h3>
                    <AlertTriangle size={20} /> Divergências recentes
                  </h3>
                  <div className="table-wrap">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: "34%" }} />
                        <col style={{ width: "32%" }} />
                        <col style={{ width: "34%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Tag</th>
                          <th>Criada em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inconsistencias.slice(0, 5).map((item) => (
                          <tr key={item.id}>
                            <td>{item.tipo}</td>
                            <td>{item.tag_id || item.item_id || "-"}</td>
                            <td>{new Date(item.criado_em).toLocaleString("pt-BR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>

              <article className="panel" style={{ marginTop: 18 }}>
                <h3>
                  <Activity size={20} /> Timeline
                </h3>
                <div className="table-wrap">
                  <table className="data-table">
                    <colgroup>
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "58%" }} />
                      <col style={{ width: "24%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Evento</th>
                        <th>Mensagem</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.slice(0, 8).map((evento) => (
                        <tr key={evento.id}>
                          <td>
                            <span className="badge">{evento.tipo}</span>
                          </td>
                          <td>{evento.mensagem}</td>
                          <td>{new Date(evento.criado_em).toLocaleString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
