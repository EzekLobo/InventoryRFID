"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, FilePlus2, Filter, Link2, MapPinCheck, RefreshCw, ShieldQuestion } from "lucide-react";
import { api } from "@/lib/api";
import type { Inconsistencia, ItemPatrimonial, Local } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

const labels: Record<string, string> = {
  local_divergente: "Local divergente",
  nao_encontrado: "Não encontrado",
  tag_desconhecida: "Tag desconhecida"
};

type ActionMode = "confirmar-local" | "resolver" | "cadastrar-tag" | "associar-tag";

type ActionState = {
  id: number;
  mode: ActionMode | null;
};

type UnknownTagForm = {
  nome: string;
  local_id: number | "";
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
    local_id: "",
    motivo: "tag cadastrada a partir de inconsistência"
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
      setError(err instanceof Error ? err.message : "Não foi possível carregar inconsistências.");
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
  const selectedMode = action?.mode || null;
  const choosingResolution = Boolean(activeInconsistencia && selectedMode === null);

  function startResolution(item: Inconsistencia) {
    startAction(item, shouldChooseMode(item.tipo) ? null : defaultModeForType(item.tipo));
  }

  function startAction(item: Inconsistencia, mode: ActionMode | null) {
    setAction({ id: item.id, mode });
    setSuccess("");
    setError("");
    setMotivo(mode ? defaultReason(mode) : "");
    setAssociateItemId("");
    setUnknownForm({
      nome: item.item_nome || "",
      local_id: item.local_fisico_id || "",
      motivo: "tag cadastrada a partir de inconsistência"
    });
  }

  function selectMode(mode: ActionMode) {
    if (!activeInconsistencia) return;
    setAction({ id: activeInconsistencia.id, mode });
    setMotivo(defaultReason(mode));
  }

  function returnToOptions() {
    if (!activeInconsistencia) return;
    setAction({ id: activeInconsistencia.id, mode: null });
    setMotivo("");
    setAssociateItemId("");
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMode || !activeInconsistencia) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (selectedMode === "confirmar-local") {
        await api.confirmarLocalInconsistencia(activeInconsistencia.id, motivo);
        setSuccess("Local lógico atualizado e inconsistência resolvida.");
      } else if (selectedMode === "resolver") {
        await api.resolverInconsistencia(activeInconsistencia.id, motivo);
        setSuccess("Inconsistência resolvida com justificativa registrada.");
      } else if (selectedMode === "cadastrar-tag") {
        await api.cadastrarTagDesconhecida(activeInconsistencia.id, {
          nome: unknownForm.nome,
          local_logico_id: unknownForm.local_id || null,
          local_fisico_id: unknownForm.local_id || null,
          motivo: unknownForm.motivo
        });
        setSuccess("Tag cadastrada como item patrimonial e inconsistência resolvida.");
      } else if (selectedMode === "associar-tag") {
        if (!associateItemId) throw new Error("Selecione um item para associar.");
        await api.associarTagDesconhecida(activeInconsistencia.id, {
          item_id: associateItemId,
          motivo: defaultReason("associar-tag")
        });
        setSuccess("Tag associada ao item existente e inconsistência resolvida.");
      }
      setAction(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível resolver a inconsistência.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content-band">
      <div className="section-head">
        <div>
          <h1>Inconsistências</h1>
          <p>Acompanhe itens fora do local esperado, não encontrados e tags desconhecidas.</p>
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
                <option value="nao_encontrado">Não encontrado</option>
                <option value="tag_desconhecida">Tag desconhecida</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="resolvida">Situação</label>
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
        {!loading && !error && data.length === 0 ? <EmptyState label="Nenhuma inconsistência encontrada." /> : null}

        {!loading && data.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table inconsistencies-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Item</th>
                  <th>Tag</th>
                  <th>Local lógico</th>
                  <th>Local físico</th>
                  <th>Situação</th>
                  <th>Ações</th>
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
                      <ActionButtons item={item} onStart={startResolution} />
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
          <ResolutionHeader inconsistencia={activeInconsistencia} onClose={() => setAction(null)} />
          {choosingResolution ? (
            <ResolutionOptions inconsistencia={activeInconsistencia} onSelect={selectMode} />
          ) : selectedMode ? (
            <form className="resolution-form" onSubmit={submitAction}>
              <ResolutionFormFields
                associateItemId={associateItemId}
                itens={itens}
                locais={locais}
                mode={selectedMode}
                motivo={motivo}
                setAssociateItemId={setAssociateItemId}
                setMotivo={setMotivo}
                setUnknownForm={setUnknownForm}
                unknownForm={unknownForm}
              />

              <div className="settings-actions">
                <button className="button" disabled={busy} type="submit">
                  <Check size={17} />
                  Confirmar
                </button>
                {shouldChooseMode(activeInconsistencia.tipo) ? (
                  <button className="button subtle" disabled={busy} type="button" onClick={returnToOptions}>
                    <ArrowLeft size={17} />
                    Voltar
                  </button>
                ) : null}
                <button className="button ghost" disabled={busy} type="button" onClick={() => setAction(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

function ActionButtons({ item, onStart }: { item: Inconsistencia; onStart: (item: Inconsistencia) => void }) {
  if (item.resolvida) {
    return <span className="muted-text">Sem ações</span>;
  }

  return (
    <button className="button action-button" type="button" onClick={() => onStart(item)}>
      <ChevronDown size={17} />
      Resolver
    </button>
  );
}

function ResolutionOptions({
  inconsistencia,
  onSelect
}: {
  inconsistencia: Inconsistencia;
  onSelect: (mode: ActionMode) => void;
}) {
  const options = modesForType(inconsistencia.tipo);

  return (
    <div className="resolution-options-grid" aria-label="Formas de resolver">
      {options.map((option) => (
        <button
          className="resolution-choice"
          key={option.mode}
          type="button"
          onClick={() => onSelect(option.mode)}
        >
          <span className="resolution-choice-icon">{option.icon}</span>
          <span>
            <strong>{option.label}</strong>
            <small>{option.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function ResolutionHeader({
  inconsistencia,
  onClose
}: {
  inconsistencia: Inconsistencia;
  onClose: () => void;
}) {
  return (
    <div className="resolution-head">
      <div>
        <h2>Resolver inconsistência</h2>
        <p className="resolution-context">
          {labels[inconsistencia.tipo]} - {inconsistencia.item_nome || inconsistencia.tag_id || `#${inconsistencia.id}`}
          {inconsistencia.local_fisico_nome ? ` - ${inconsistencia.local_fisico_nome}` : ""}
        </p>
      </div>
      <button className="button ghost" type="button" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
}

function ResolutionFormFields({
  associateItemId,
  itens,
  locais,
  mode,
  motivo,
  setAssociateItemId,
  setMotivo,
  setUnknownForm,
  unknownForm
}: {
  associateItemId: number | "";
  itens: ItemPatrimonial[];
  locais: Local[];
  mode: ActionMode;
  motivo: string;
  setAssociateItemId: (itemId: number | "") => void;
  setMotivo: (motivo: string) => void;
  setUnknownForm: (form: UnknownTagForm) => void;
  unknownForm: UnknownTagForm;
}) {
  if (mode === "cadastrar-tag") {
    return <UnknownTagFields form={unknownForm} locais={locais} setForm={setUnknownForm} />;
  }

  if (mode === "associar-tag") {
    return (
      <label className="field">
        <span>Item existente</span>
        <select
          className="select"
          required
          value={associateItemId}
          onChange={(event) => setAssociateItemId(Number(event.target.value) || "")}
        >
          <option value="">Selecione</option>
          {itens.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome} - {item.tag_id}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="field">
      <span>Justificativa</span>
      <textarea
        className="textarea compact"
        required
        value={motivo}
        onChange={(event) => setMotivo(event.target.value)}
      />
    </label>
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
        <span>Local do item</span>
        <select
          className="select"
          required
          value={form.local_id}
          onChange={(event) => setForm({ ...form, local_id: Number(event.target.value) || "" })}
        >
          <option value="">Selecione</option>
          {locais.map((local) => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function defaultReason(mode: ActionMode) {
  const reasons: Record<ActionMode, string> = {
    "confirmar-local": "local atual confirmado como novo local lógico",
    resolver: "resolução manual com justificativa",
    "cadastrar-tag": "tag cadastrada a partir de inconsistência",
    "associar-tag": "tag associada a item existente"
  };
  return reasons[mode];
}

function actionTitle(mode: ActionMode) {
  const titles: Record<ActionMode, string> = {
    "confirmar-local": "Atualizar local lógico",
    resolver: "Resolver inconsistência",
    "cadastrar-tag": "Cadastrar tag desconhecida",
    "associar-tag": "Associar tag a item"
  };
  return titles[mode];
}

function defaultModeForType(tipo: string): ActionMode {
  if (tipo === "local_divergente") return "confirmar-local";
  return "resolver";
}

function shouldChooseMode(tipo: string) {
  return tipo === "local_divergente" || tipo === "tag_desconhecida";
}

function modesForType(tipo: string) {
  if (tipo === "local_divergente") {
    return [
      {
        mode: "confirmar-local" as const,
        label: "Atualizar local lógico",
        description: "Confirma este local físico como o novo local esperado do item.",
        icon: <MapPinCheck size={18} />
      },
      {
        mode: "resolver" as const,
        label: "Resolver com justificativa",
        description: "Fecha a inconsistência sem alterar o cadastro do item.",
        icon: <Check size={18} />
      }
    ];
  }

  if (tipo === "tag_desconhecida") {
    return [
      {
        mode: "cadastrar-tag" as const,
        label: "Cadastrar novo item",
        description: "Cria um patrimônio com esta tag e resolve a leitura.",
        icon: <FilePlus2 size={18} />
      },
      {
        mode: "associar-tag" as const,
        label: "Associar a item existente",
        description: "Vincula esta tag a um item já cadastrado.",
        icon: <Link2 size={18} />
      },
      {
        mode: "resolver" as const,
        label: "Ignorar leitura",
        description: "Fecha a inconsistência registrando uma justificativa.",
        icon: <ShieldQuestion size={18} />
      }
    ];
  }

  return [
    {
      mode: "resolver" as const,
      label: "Resolver com justificativa",
      description: "Fecha a inconsistência com motivo registrado.",
      icon: <Check size={18} />
    }
  ];
}
