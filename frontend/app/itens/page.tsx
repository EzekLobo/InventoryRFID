"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { ItemPatrimonial } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

export default function ItensPage() {
  const [itens, setItens] = useState<ItemPatrimonial[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(term = search) {
    setLoading(true);
    setError("");
    try {
      setItens(await api.listItens(term));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar itens.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Patrimônio</h1>
          <p>Consulte itens por nome ou tag e confira local lógico versus local físico.</p>
        </div>
      </div>

      <article className="panel">
        <form
          className="toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            load(search);
          }}
        >
          <div className="field">
            <label htmlFor="search">Busca</label>
            <input
              className="input"
              id="search"
              placeholder="Nome ou tag"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="button" type="submit">
            <Search size={17} />
            Buscar
          </button>
        </form>

        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && itens.length === 0 ? <EmptyState label="Nenhum item encontrado." /> : null}

        {!loading && itens.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Tag</th>
                  <th>Local lógico</th>
                  <th>Local físico</th>
                  <th>Responsável</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.tag_id}</td>
                    <td>{item.local_logico_nome || "-"}</td>
                    <td>{item.local_fisico_nome || "-"}</td>
                    <td>{item.responsavel_nome || "-"}</td>
                    <td>
                      <span className={item.ativo ? "badge green" : "badge red"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
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
