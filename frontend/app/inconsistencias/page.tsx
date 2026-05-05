"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, FilePlus2, Filter, Link2, MapPinCheck, RefreshCw, ShieldQuestion } from "lucide-react";
import { api } from "@/lib/api";
import type { Inconsistencia, ItemPatrimonial, Local } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

const labels: Record<string, string> = {
  local_divergente: "Local divergente",
  nao_encontrado: "Nao encontrado",
  tag_desconhecida: "Tag desconhecida"
};

type ActionMode = "confirmar-local" | "resolver" | "cadastrar-tag" | "associar-tag";

type ActionState = {
  id: number;
  mode: ActionMode;
};

type UnknownTagForm = {
  nome: string;
  local_logico_id: number | "";
  local_fisico_id: number | "";
  motivo: string;
};

export default function InconsistenciasPage() {
  const [data, setData] = useState<Inconsistencia[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [itens, setItens] = useState<ItemPatrimonial[]>([]);
  const [tipo, setTipo] = useState("");
  const [resolvida, setResolvida] = useState("false");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [action, setAction] = useState<ActionState | null>(null);
  const [motivo, setMotivo] = useState("");
  const [unknownForm, setUnknownForm] = useState<UnknownTagForm>({
    nome: "",
    local_logico_id: "",
    local_fisico_id: "",
    motivo: "tag cadastrada a partir de divergencia"
  });
  const [associateItemId, setAssociateItemId] = useState<number | "">("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [inconsistenciasData, locaisData, itensData] = await Promise.all([
        api.listInconsistencias(resolvida, tipo),
        api.listLocais(),
        api.listItens()
      ]);
      setData(inconsistenciasData);
      setLocais(locaisData);
      setItens(itensData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar divergencias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tipo, resolvida]);

  const activeInconsistencia = useMemo(
    () => data.find((item) => item.id === action?.id) || null,
    [action, data]
  );

  function startAction(item: Inconsistencia, mode: ActionMode) {
    setAction({ id: item.id, mode });
    setSuccess("");
    setError("");
    setMotivo(defaultReason(mode));
    setAssociateItemId("");
    setUnknownForm({
      nome: item.item_nome || "",
      local_logico_id: item.local_fisico_id || "",
      local_fisico_id: item.local_fisico_id || "",
      motivo: "tag cadastrada a partir de divergencia"
    });
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || !activeInconsistencia) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (action.mode === "confirmar-local") {
        await api.confirmarLocalInconsistencia(activeInconsistencia.id, motivo);
        setSuccess("Local logico atualizado e divergencia resolvida.");
      } else if (action.mode === "resolver") {
        await api.resolverInconsistencia(activeInconsistencia.id, motivo);
        setSuccess("Divergencia resolvida com justificativa registrada.");
      } else if (action.mode === "cadastrar-tag") {
        await api.cadastrarTagDesconhecida(activeInconsistencia.id, {
          nome: unknownForm.nome,
          local_logico_id: unknownForm.local_logico_id || null,
          local_fisico_id: unknownForm.local_fisico_id || null,
          motivo: unknownForm.motivo
        });
        setSuccess("Tag cadastrada como item patrimonial e divergencia resolvida.");
      } else if (action.mode === "associar-tag") {
        if (!associateItemId) throw new Error("Selecione um item para associar.");
        await api.associarTagDesconhecida(activeInconsistencia.id, {
          item_id: associateItemId,
          motivo
        });
        setSuccess("Tag associada ao item existente e divergencia resolvida.");
      }
      setAction(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel resolver a divergencia.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Divergencias</h1>
          <p>Acompanhe itens fora do local esperado, nao encontrados e tags desconhecidas.</p>
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
                <option value="nao_encontrado">Nao encontrado</option>
                <option value="tag_desconhecida">Tag desconhecida</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="resolvida">Situacao</label>
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

        {success ? <div className="process-feedback done">{success}</div> : null}
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && data.length === 0 ? <EmptyState label="Nenhuma divergencia encontrada." /> : null}

        {!loading && data.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table inconsistencies-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Item</th>
                  <th>Tag</th>
                  <th>Local logico</th>
                  <th>Local fisico</th>
                  <th>Situacao</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>{labels[item.tipo] || item.tipo}</td>
                    <td>{item.item_nome || item.item_id || "-"}</td>
                    <td>{item.tag_id || "-"}</td>
                    <td>{item.local_logico_nome || item.local_logico_id || "-"}</td>
                    <td>{item.local_fisico_nome || item.local_fisico_id || "-"}</td>
                    <td>
                      <span className={item.resolvida ? "badge green" : "badge red"}>
                        {item.resolvida ? "Resolvida" : "Aberta"}
                      </span>
                    </td>
                    <td>
                      <ActionButtons item={item} onStart={startAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      {action && activeInconsistencia ? (
        <article className="panel resolution-panel">
          <ResolutionHeader inconsistencia={activeInconsistencia} mode={action.mode} onClose={() => setAction(null)} />
          <form className="settings-form" onSubmit={submitAction}>
            {action.mode === "cadastrar-tag" ? (
              <UnknownTagFields form={unknownForm} locais={locais} setForm={setUnknownForm} />
            ) : null}

            {action.mode === "associar-tag" ? (
              <label className="field">
                <span>Item existente</span>
                <select
                  className="select"
                  required
                  value={associateItemId}
                  onChange={(event) => setAssociateItemId(Number(event.target.value))}
                >
                  <option value="">Selecione</option>
                  {itens.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} - {item.tag_id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {action.mode !== "cadastrar-tag" ? (
              <label className="field">
                <span>Justificativa</span>
                <textarea
                  className="textarea compact"
                  required
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                />
              </label>
            ) : null}

            <div className="settings-actions">
              <button className="button" disabled={busy} type="submit">
                <Check size={17} />
                Confirmar
              </button>
              <button className="button ghost" disabled={busy} type="button" onClick={() => setAction(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </article>
      ) : null}
    </section>
  );
}

function ActionButtons({ item, onStart }: { item: Inconsistencia; onStart: (item: Inconsistencia, mode: ActionMode) => void }) {
  if (item.resolvida) {
    return <span className="muted-text">Sem acoes</span>;
  }

  if (item.tipo === "local_divergente") {
    return (
      <div className="action-buttons">
        <button className="button action-button" type="button" onClick={() => onStart(item, "confirmar-local")}>
          <MapPinCheck size={17} />
          Atualizar local
        </button>
        <button className="button ghost action-button" type="button" onClick={() => onStart(item, "resolver")}>
          <Check size={17} />
          Resolver
        </button>
      </div>
    );
  }

  if (item.tipo === "tag_desconhecida") {
    return (
      <div className="action-buttons">
        <button className="button action-button" type="button" onClick={() => onStart(item, "cadastrar-tag")}>
          <FilePlus2 size={17} />
          Cadastrar
        </button>
        <button className="button ghost action-button" type="button" onClick={() => onStart(item, "associar-tag")}>
          <Link2 size={17} />
          Associar
        </button>
        <button className="button ghost action-button" type="button" onClick={() => onStart(item, "resolver")}>
          <ShieldQuestion size={17} />
          Ignorar
        </button>
      </div>
    );
  }

  return (
    <button className="button ghost action-button" type="button" onClick={() => onStart(item, "resolver")}>
      <Check size={17} />
      Resolver com motivo
    </button>
  );
}

function ResolutionHeader({
  inconsistencia,
  mode,
  onClose
}: {
  inconsistencia: Inconsistencia;
  mode: ActionMode;
  onClose: () => void;
}) {
  return (
    <div className="settings-detail-head">
      <h2>{actionTitle(mode)}</h2>
      <button className="button ghost" type="button" onClick={onClose}>
        Fechar
      </button>
      <p className="resolution-context">
        {labels[inconsistencia.tipo]} - {inconsistencia.item_nome || inconsistencia.tag_id || `#${inconsistencia.id}`}
      </p>
    </div>
  );
}

function UnknownTagFields({
  form,
  locais,
  setForm
}: {
  form: UnknownTagForm;
  locais: Local[];
  setForm: (form: UnknownTagForm) => void;
}) {
  return (
    <>
      <label className="field">
        <span>Nome do item</span>
        <input className="input" required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
      </label>
      <label className="field">
        <span>Local logico</span>
        <select
          className="select"
          value={form.local_logico_id}
          onChange={(event) => setForm({ ...form, local_logico_id: Number(event.target.value) || "" })}
        >
          <option value="">Usar local da leitura</option>
          {locais.map((local) => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Local fisico</span>
        <select
          className="select"
          value={form.local_fisico_id}
          onChange={(event) => setForm({ ...form, local_fisico_id: Number(event.target.value) || "" })}
        >
          <option value="">Usar local da leitura</option>
          {locais.map((local) => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Justificativa</span>
        <textarea
          className="textarea compact"
          required
          value={form.motivo}
          onChange={(event) => setForm({ ...form, motivo: event.target.value })}
        />
      </label>
    </>
  );
}

function defaultReason(mode: ActionMode) {
  const reasons: Record<ActionMode, string> = {
    "confirmar-local": "local atual confirmado como novo local logico",
    resolver: "resolucao manual com justificativa",
    "cadastrar-tag": "tag cadastrada a partir de divergencia",
    "associar-tag": "tag associada a item existente"
  };
  return reasons[mode];
}

function actionTitle(mode: ActionMode) {
  const titles: Record<ActionMode, string> = {
    "confirmar-local": "Atualizar local logico",
    resolver: "Resolver divergencia",
    "cadastrar-tag": "Cadastrar tag desconhecida",
    "associar-tag": "Associar tag a item"
  };
  return titles[mode];
}
