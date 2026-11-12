import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Folder,
  FolderOpen,
  HardDrive,
  LockKeyhole,
} from "lucide-react";
import { Busy, Empty, Notice } from "../../design-system/ui";
import {
  bytes,
  errorMessage,
  native,
  nativeAvailable,
} from "../../services/native";
import type {
  Disk,
  StorageNode,
  StorageReport,
  StorageProgress,
} from "../../types/system";

import { Sunburst, storageColors as colors } from "./Sunburst";

export function Storage({
  disks,
  notify,
}: {
  disks: Disk[];
  notify: (text: string) => void;
}) {
  const [mount, setMount] = useState("");
  const [data, setData] = useState<StorageReport | null>(null);
  const [trail, setTrail] = useState<StorageNode[]>([]);
  const [hover, setHover] = useState<StorageNode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<StorageProgress | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [remember, setRemember] = useState(true);
  const [scannedAt, setScannedAt] = useState<number | null>(null);
  const saved = useRef(
    new Map<
      string,
      { data: StorageReport; trail: StorageNode[]; scannedAt: number }
    >(),
  );
  const activeScan = useRef<string | null>(null);
  useEffect(
    () => () => {
      const id = activeScan.current;
      activeScan.current = null;
      if (id)
        void native.cancelStorage(id).catch(() => {
          /* A análise pode já ter terminado. */
        });
    },
    [],
  );
  useEffect(() => {
    const id = activeScan.current;
    if (!busy || !id) return;
    let active = true;
    let pending = false;
    const timer = window.setInterval(async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await native.storageProgress(id);
        if (active) {
          setProgress(next);
          setProgressError(false);
        }
      } catch {
        if (active) setProgressError(true);
      } finally {
        pending = false;
      }
    }, 500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [busy]);
  const root = trail.at(-1) ?? data?.root;
  const chosen = mount || disks[0]?.mount || "";
  async function analyze() {
    const id = crypto.randomUUID();
    activeScan.current = id;
    setMount(chosen);
    setBusy(true);
    setProgress(null);
    setProgressError(false);
    setCancelling(false);
    setError("");
    setData(null);
    setTrail([]);
    setHover(null);
    try {
      const result = await native.storage(chosen, id);
      if (activeScan.current === id) {
        const time = Date.now();
        setData(result);
        setScannedAt(time);
        if (remember)
          saved.current.set(chosen, {
            data: result,
            trail: [],
            scannedAt: time,
          });
      }
    } catch (e) {
      if (activeScan.current === id) setError(errorMessage(e));
    } finally {
      if (activeScan.current === id) {
        activeScan.current = null;
        setBusy(false);
      }
    }
  }
  function changeUnit(next: string) {
    if (remember && data && scannedAt !== null)
      saved.current.set(chosen, { data, trail, scannedAt });
    const previous = remember ? saved.current.get(next) : undefined;
    setMount(next);
    setData(previous?.data ?? null);
    setTrail(previous?.trail ?? []);
    setScannedAt(previous?.scannedAt ?? null);
    setHover(null);
    setError("");
  }
  async function cancel() {
    const id = activeScan.current;
    if (!id) return;
    setCancelling(true);
    try {
      await native.cancelStorage(id);
    } catch (e) {
      setCancelling(false);
      setError(errorMessage(e));
    }
  }
  function enter(node: StorageNode) {
    if (node.children.length) {
      setTrail((t) => [...t, node]);
      setHover(null);
    } else
      notify(
        "Nenhum subnível disponível nesta análise. Use Abrir localização para explorar.",
      );
  }
  async function copy(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      notify("Caminho copiado.");
    } catch {
      notify("Não foi possível acessar a área de transferência.");
    }
  }
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">CADA ARQUIVO EM SEU LUGAR</span>
          <h1>Armazenamento</h1>
          <p>Descubra para onde vai o espaço do seu disco.</p>
        </div>
      </div>
      <div className="disk-bar">
        <label>
          Unidade
          <select
            value={chosen}
            disabled={busy}
            onChange={(e) => changeUnit(e.target.value)}
          >
            {disks.length ? (
              disks.map((d) => (
                <option value={d.mount} key={d.mount}>
                  {d.mount} · {bytes(d.total)} · {d.kind}
                </option>
              ))
            ) : (
              <option value="">Abra o aplicativo desktop</option>
            )}
          </select>
        </label>
        <button
          className="primary"
          disabled={!nativeAvailable || !chosen || busy}
          onClick={() => void analyze()}
        >
          {data ? "Analisar novamente" : "Analisar unidade"}
        </button>
      </div>
      <div className="storage-retention">
        <label>
          <input
            type="checkbox"
            checked={remember}
            disabled={busy}
            onChange={(e) => {
              setRemember(e.target.checked);
              if (!e.target.checked) saved.current.clear();
            }}
          />
          Guardar resultados ao trocar de unidade nesta sessão
        </label>
        {data && scannedAt !== null && (
          <span>
            Última análise: {new Date(scannedAt).toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      {error && (
        <div role="alert" className="error-box">
          {error}
        </div>
      )}
      {busy ? (
        <div className="panel storage-scan" aria-busy="true">
          <Busy>
            {cancelling
              ? "Finalizando o cancelamento…"
              : "Analisando arquivos e pastas…"}
          </Busy>
          {progress && (
            <>
              <dl className="scan-statistics">
                {[
                  ["Arquivos lidos", progress.files.toLocaleString("pt-BR")],
                  [
                    "Pastas encontradas",
                    progress.folders.toLocaleString("pt-BR"),
                  ],
                  ["Dados encontrados", bytes(progress.bytes)],
                  [
                    "Tempo decorrido",
                    `${Math.floor(progress.elapsedSeconds / 60)} min ${progress.elapsedSeconds % 60} s`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="scan-current" title={progress.currentFolder}>
                {progress.currentFolder || "Preparando a leitura…"}
              </p>
              <p className="subtle">
                {progress.visited.toLocaleString("pt-BR")} entradas visitadas ·{" "}
                {progress.skipped.toLocaleString("pt-BR")} inacessíveis ou
                ignoradas
              </p>
            </>
          )}
          {progressError && (
            <p className="subtle">
              O andamento está temporariamente indisponível. A leitura continua.
            </p>
          )}
          <p className="subtle">
            A leitura continua até concluir a unidade selecionada. Nenhum
            arquivo é alterado. Você pode trocar de aba; a análise continua em
            segundo plano.
          </p>
          <button
            className="secondary"
            disabled={cancelling}
            onClick={() => void cancel()}
          >
            {cancelling ? "Cancelando…" : "Cancelar análise"}
          </button>
        </div>
      ) : root ? (
        <>
          <div className="storage-layout">
            <section className="panel sunburst-panel">
              <div className="section-top">
                <button
                  className="text-button"
                  disabled={!trail.length}
                  onClick={() => {
                    setTrail((t) => t.slice(0, -1));
                    setHover(null);
                  }}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <span className="subtle">
                  Tamanho lógico · {bytes(root.size)}
                </span>
              </div>
              <Sunburst root={root} enter={enter} hover={setHover}>
                {trail.length > 0 && (
                  <circle
                    cx="240"
                    cy="240"
                    r="88"
                    fill="var(--surface)"
                    className="sunburst-back"
                    role="button"
                    tabIndex={0}
                    aria-label="Voltar ao nível anterior"
                    onClick={() => {
                      setTrail((t) => t.slice(0, -1));
                      setHover(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTrail((t) => t.slice(0, -1));
                        setHover(null);
                      }
                    }}
                  >
                    <title>Voltar ao nível anterior</title>
                  </circle>
                )}
                <text x="240" y="220" className="sun-name">
                  {(hover?.name ?? root.name).slice(0, 20)}
                </text>
                <text x="240" y="250" className="sun-size">
                  {bytes(hover?.size ?? root.size)}
                </text>
                <text x="240" y="276" className="sun-caption">
                  {hover && root.size
                    ? `${((hover.size / root.size) * 100).toFixed(1)}% desta pasta`
                    : trail.length
                      ? "Clique no centro para voltar"
                      : "arquivos analisados"}
                </text>
              </Sunburst>
              <p className="sun-path" title={hover?.path ?? root.path}>
                {hover?.path ?? root.path}
              </p>
            </section>
            <section className="panel folders-panel">
              <div className="section-top">
                <h2>Maiores pastas e arquivos</h2>
                <Folder size={18} />
              </div>
              <div className="folder-list">
                {root.children.slice(0, 30).map((n, i) => (
                  <div className="folder-row" key={n.path}>
                    <button className="folder-name" onClick={() => enter(n)}>
                      <Folder
                        size={20}
                        style={{ color: colors[i % colors.length] }}
                      />
                      <span title={n.path}>
                        {n.name}
                        <small>
                          {bytes(n.size)} ·{" "}
                          {root.size
                            ? ((n.size / root.size) * 100).toFixed(1)
                            : 0}
                          %
                        </small>
                      </span>
                      {n.protected && <LockKeyhole size={13} />}
                    </button>
                    <div className="folder-actions">
                      <button
                        title="Copiar caminho"
                        aria-label={`Copiar caminho de ${n.name}`}
                        className="icon-button"
                        onClick={() => void copy(n.path)}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        title="Abrir localização"
                        aria-label={`Abrir localização de ${n.name}`}
                        className="icon-button"
                        onClick={() =>
                          void native
                            .openLocation(n.path)
                            .catch((e) => notify(errorMessage(e)))
                        }
                      >
                        <FolderOpen size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <Notice>
            {data?.visited.toLocaleString("pt-BR")} entradas visitadas ·{" "}
            {data?.skipped} inacessíveis ou ignoradas.{" "}
            {data?.cancelled
              ? "Análise cancelada: resultado parcial dos itens já lidos."
              : "Análise concluída dos arquivos acessíveis."}{" "}
            Links e pontos de montagem são ignorados. O gráfico mostra bytes
            analisados, não a ocupação física do disco.
          </Notice>
        </>
      ) : (
        <div className="panel">
          <Empty
            title="Veja seu disco de outro jeito"
            action={<HardDrive size={42} strokeWidth={1} />}
          >
            Selecione uma unidade e inicie a análise. As fatias representam o
            tamanho real dos arquivos acessíveis.
          </Empty>
        </div>
      )}
    </>
  );
}
