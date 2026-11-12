import { useState } from "react";
import {
  Check,
  File,
  FolderClock,
  ScanLine,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Busy, Dialog, Empty, Notice } from "../../design-system/ui";
import {
  bytes,
  errorMessage,
  native,
  nativeAvailable,
} from "../../services/native";
import type {
  CleanupCategory,
  CleanupPlan,
  CleanupResult,
} from "../../types/system";
import { RecycleBin } from "./RecycleBin";

const categoryNames: Record<CleanupCategory, string> = {
  user_temp: "%TEMP% do usuário",
  windows_temp: "Temp do Windows",
  prefetch: "Prefetch (avançado)",
};

export function Cleanup() {
  const [plan, setPlan] = useState<CleanupPlan | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [categories, setCategories] = useState<CleanupCategory[]>([
    "user_temp",
    "windows_temp",
  ]);
  const [visible, setVisible] = useState(200);
  async function analyze() {
    setBusy(true);
    setError("");
    setResult(null);
    setPlan(null);
    setSelected(new Set());
    setVisible(200);
    try {
      const next = await native.scanCleanup(categories);
      setPlan(next);
      setSelected(new Set());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function clean() {
    if (!plan) return;
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      setResult(await native.clean(plan.id, [...selected]));
      setPlan(null);
      setSelected(new Set());
    } catch (e) {
      setError(errorMessage(e));
      setPlan(null);
    } finally {
      setBusy(false);
    }
  }
  const total =
    plan?.files
      .filter((f) => selected.has(f.id))
      .reduce((sum, f) => sum + f.size, 0) ?? 0;
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">MAIS ESPAÇO, COM CONTROLE</span>
          <h1>Limpeza do sistema</h1>
          <p>Você escolhe o que sai. O Sweeply cuida do resto.</p>
        </div>
        <span className="tag">
          <ShieldCheck size={14} /> Revisão obrigatória
        </span>
      </div>
      <section className="panel cleanup-categories">
        <h2>Pastas para analisar</h2>
        <div className="catalog-row">
          {(Object.keys(categoryNames) as CleanupCategory[]).map((category) => (
            <label key={category}>
              <input
                type="checkbox"
                checked={categories.includes(category)}
                disabled={busy}
                onChange={(e) => {
                  setCategories((current) =>
                    e.target.checked
                      ? [...current, category]
                      : current.filter((c) => c !== category),
                  );
                  setPlan(null);
                  setResult(null);
                  setSelected(new Set());
                }}
              />
              {categoryNames[category]}
            </label>
          ))}
        </div>
        <p>
          Leitura completa das subpastas. Temporários modificados nos últimos 7
          dias são preservados; arquivos em uso e protegidos ficam fora da
          seleção.
        </p>
        {categories.includes("prefetch") && (
          <Notice>
            Prefetch é um cache que o Windows recria. Limpar não garante ganho
            de desempenho e pode tornar as primeiras aberturas mais lentas. Esta
            opção inclui somente arquivos .pf com mais de 7 dias; pode exigir
            administrador.
          </Notice>
        )}
      </section>
      <ol className="steps">
        {["Analisar", "Revisar", "Limpar"].map((s, i) => (
          <li
            key={s}
            className={(result ? 2 : plan ? 1 : 0) >= i ? "current" : ""}
          >
            <span>
              {(result ? 2 : plan ? 1 : 0) > i ? (
                <Check size={14} />
              ) : (
                `0${i + 1}`
              )}
            </span>
            {s}
          </li>
        ))}
      </ol>
      {error && (
        <div role="alert" className="error-box">
          {error}
        </div>
      )}
      {busy ? (
        <div className="panel">
          <Busy>
            {plan
              ? "Processando os arquivos aprovados…"
              : "Analisando todas as subpastas selecionadas…"}
          </Busy>
          <p className="center subtle">
            Arquivos em uso, protegidos e links são ignorados.
          </p>
        </div>
      ) : result ? (
        <section className="panel result">
          <ShieldCheck size={40} />
          <h2>
            {result.skipped
              ? "Limpeza finalizada com pendências"
              : "Limpeza concluída"}
          </h2>
          <strong>{bytes(result.freed)}</strong>
          <p>em {result.deleted} arquivos removidos</p>
          <p className="subtle">
            Tamanho lógico removido. O espaço físico recuperado pode variar.
          </p>
          <p className="subtle">{result.skipped} arquivos ignorados</p>
          {result.errors.length > 0 && (
            <details>
              <summary>Ver {result.errors.length} ocorrências</summary>
              {result.errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </details>
          )}
          <button
            className="secondary"
            disabled={!categories.length}
            onClick={() => void analyze()}
          >
            Analisar novamente
          </button>
        </section>
      ) : plan ? (
        <>
          <div className="panel cleanup-list">
            <div className="section-top">
              <div>
                <h2>Arquivos disponíveis para limpeza</h2>
                <p className="subtle">
                  Arquivos sem modificação há pelo menos 7 dias.
                </p>
              </div>
              <span className="tag">{bytes(plan.total)} encontrados</span>
            </div>
            {plan.files.length ? (
              <>
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={selected.size === plan.files.length}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? new Set(plan.files.map((f) => f.id))
                          : new Set(),
                      )
                    }
                  />
                  Selecionar todos ({plan.files.length})
                  <span className="subtle">Exclusão permanente</span>
                </label>
                <div className="file-list">
                  {plan.files.slice(0, visible).map((f) => (
                    <label className="file-row" key={f.id}>
                      <input
                        type="checkbox"
                        checked={selected.has(f.id)}
                        onChange={(e) =>
                          setSelected((old) => {
                            const next = new Set(old);
                            if (e.target.checked) next.add(f.id);
                            else next.delete(f.id);
                            return next;
                          })
                        }
                      />
                      <File size={17} />
                      <span title={`${categoryNames[f.category]} · ${f.path}`}>
                        {f.path}
                      </span>
                      <strong>{bytes(f.size)}</strong>
                    </label>
                  ))}
                </div>
                {visible < plan.files.length && (
                  <button
                    className="text-button"
                    onClick={() => setVisible((n) => n + 200)}
                  >
                    Mostrar mais arquivos ({visible} de {plan.files.length})
                  </button>
                )}
              </>
            ) : (
              <Empty
                title={
                  plan.blocked || plan.warnings.length
                    ? "Nenhum arquivo removível nesta análise"
                    : "Nada para limpar nas pastas analisadas"
                }
              >
                {plan.blocked || plan.warnings.length
                  ? "Há itens ou pastas indisponíveis. Veja os avisos abaixo."
                  : "A leitura terminou. Nenhum arquivo elegível foi encontrado; itens recentes são preservados."}
              </Empty>
            )}
          </div>
          {plan.skipped > 0 && (
            <Notice>
              {plan.skipped} itens preservados ou ignorados, incluindo{" "}
              {plan.blocked} itens/pastas bloqueados ou inacessíveis. Não são
              apresentados como arquivos removíveis. Novos temporários podem ser
              criados pelo Windows e pelos aplicativos.
            </Notice>
          )}
          {plan.warnings.map((warning) => (
            <Notice key={warning}>{warning}</Notice>
          ))}
          {plan.files.length > 0 && (
            <div className="cleanup-total">
              <div>
                <span className="subtle">
                  Potencialmente recuperável na seleção
                </span>
                <strong>{bytes(total)}</strong>
              </div>
              <button
                className="primary"
                disabled={!selected.size}
                onClick={() => setConfirm(true)}
              >
                Revisar e limpar <ArrowRight size={16} />
              </button>
            </div>
          )}
          <p className="quiet-note">
            O espaço liberado pode variar. Nenhum arquivo é removido sem sua
            confirmação. O plano vale por 15 minutos; os arquivos são
            verificados novamente antes da exclusão.
          </p>
          <button className="text-button" onClick={() => void analyze()}>
            Refazer análise
          </button>
        </>
      ) : (
        <section className="panel scan-intro">
          <div className="scan-symbol">
            <FolderClock size={38} />
          </div>
          <h2>
            Menos arquivos temporários.
            <br />
            Mais espaço para o que é seu.
          </h2>
          <p>
            Encontre temporários antigos nas pastas selecionadas.
            <br />
            Veja o caminho e o tamanho de cada arquivo antes de decidir.
          </p>
          <button
            className="primary"
            disabled={!nativeAvailable || !categories.length}
            onClick={() => void analyze()}
          >
            <ScanLine size={18} /> Analisar temporários
          </button>
          <span className="quiet-note">
            <ShieldCheck size={14} /> A análise não modifica seus arquivos
          </span>
          {!nativeAvailable && (
            <Notice>Disponível no aplicativo desktop.</Notice>
          )}
        </section>
      )}
      <details className="scope-details">
        <summary>O que esta versão analisa?</summary>
        <p>
          %TEMP% do usuário e a pasta Temp do Windows são percorridas por
          completo. Prefetch é opcional e inclui somente arquivos .pf. São
          elegíveis arquivos regulares sem modificação há pelo menos 7 dias.
          Pastas, links, documentos e Downloads não são removidos. A limpeza
          pode ignorar arquivos que mudarem ou forem abertos após a análise. A
          Lixeira tem uma operação separada, abaixo, e não segue o filtro de
          idade.
        </p>
      </details>
      <RecycleBin />
      {confirm && (
        <Dialog
          title="Confirmar exclusão permanente"
          close={() => setConfirm(false)}
        >
          <p>
            Remover {selected.size} arquivos temporários selecionados, com até{" "}
            {bytes(total)}?
          </p>
          <Notice>
            Esta ação não envia arquivos à Lixeira e não pode ser desfeita.
            Confira os caminhos na lista antes de continuar.
          </Notice>
          <div className="dialog-actions">
            <button className="secondary" onClick={() => setConfirm(false)}>
              Voltar à revisão
            </button>
            <button className="danger" onClick={() => void clean()}>
              Excluir arquivos selecionados
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
