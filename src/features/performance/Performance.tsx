import { useRef, useState } from "react";
import { Cpu, MemoryStick, Search, ListFilter } from "lucide-react";
import { Busy, Dialog, Empty, Notice, Sparkline } from "../../design-system/ui";
import { bytes, native, errorMessage } from "../../services/native";
import type { SystemReport, ProcessDetails } from "../../types/system";

export function Performance({
  report,
  history,
  refresh,
}: {
  report: SystemReport | null;
  history: { cpu: number[]; ram: number[] };
  refresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"cpu" | "memory">("cpu");
  const [opened, setOpened] = useState(false);
  const [details, setDetails] = useState<ProcessDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inspection = useRef(0);
  async function inspect(pid: number, confirm = false) {
    const request = ++inspection.current;
    setOpened(true);
    setLoading(true);
    setDetails(null);
    setError("");
    setConfirmation(false);
    try {
      const result = await native.processDetails(pid);
      if (request === inspection.current) {
        setDetails(result);
        setConfirmation(
          confirm && !result.terminationBlock && !!result.identity,
        );
      }
    } catch (e) {
      if (request === inspection.current) setError(errorMessage(e));
    } finally {
      if (request === inspection.current) setLoading(false);
    }
  }
  async function terminate() {
    if (!details?.identity || details.terminationBlock) return;
    setEnding(true);
    setError("");
    try {
      const message = await native.terminateProcess(
        details.pid,
        details.identity,
      );
      setNotice(message);
      setOpened(false);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
      setConfirmation(false);
      setDetails((current) =>
        current
          ? {
              ...current,
              terminationBlock:
                "Atualize os detalhes antes de tentar novamente.",
            }
          : null,
      );
    } finally {
      setEnding(false);
    }
  }
  const processes =
    report?.processes
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b[sort] - a[sort]) ?? [];
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">SAIBA O QUE ESTÁ ACONTECENDO</span>
          <h1>Desempenho</h1>
          <p>O ritmo do seu computador, em tempo real.</p>
        </div>
        <span className="tag">Últimas 30 amostras</span>
      </div>
      {notice && <Notice>{notice}</Notice>}
      <div className="performance-charts">
        {[
          {
            name: "Processador",
            icon: Cpu,
            value: report ? `${Math.round(report.cpu)}%` : "—",
            color: "var(--cpu)",
            values: history.cpu,
          },
          {
            name: "Memória",
            icon: MemoryStick,
            value: report
              ? `${bytes(report.memoryUsed)} de ${bytes(report.memoryTotal)}`
              : "—",
            color: "var(--ram)",
            values: history.ram,
          },
        ].map(({ name, icon: Icon, value, color, values }) => (
          <section className="panel performance-chart" key={name}>
            <div className="chart-heading">
              <Icon size={24} style={{ color }} />
              <div>
                <h2>{name}</h2>
                <strong>{value}</strong>
              </div>
              <span className="subtle">100%</span>
            </div>
            <Sparkline
              values={values}
              color={color}
              label={`Histórico percentual de ${name}`}
            />
            <div className="chart-axis">
              <span>60 s atrás</span>
              <span>Agora</span>
            </div>
          </section>
        ))}
      </div>
      <section className="panel processes">
        <div className="section-top">
          <h2>
            Processos <span className="count">{processes.length}</span>
          </h2>
          <div className="table-controls">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Buscar processo"
                placeholder="Buscar processo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="sort">
              <ListFilter size={16} />
              <select
                aria-label="Ordenar processos"
                value={sort}
                onChange={(e) => setSort(e.target.value as "cpu" | "memory")}
              >
                <option value="cpu">CPU</option>
                <option value="memory">Memória</option>
              </select>
            </label>
          </div>
        </div>
        {report ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>PID</th>
                  <th>CPU</th>
                  <th>Memória</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {processes.slice(0, 100).map((p) => (
                  <tr key={p.pid}>
                    <td title={p.path ?? undefined}>
                      <span className="process-icon">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      {p.name}
                    </td>
                    <td>{p.pid}</td>
                    <td>
                      {p.cpu.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </td>
                    <td>{bytes(p.memory)}</td>
                    <td>
                      <div className="process-actions">
                        <button
                          className="secondary"
                          aria-label={`Detalhes de ${p.name} (PID ${p.pid})`}
                          onClick={() => void inspect(p.pid)}
                        >
                          Detalhes
                        </button>
                        <button
                          className="secondary"
                          aria-label={`Encerrar ${p.name} (PID ${p.pid})`}
                          onClick={() => void inspect(p.pid, true)}
                        >
                          Encerrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!processes.length && (
              <p className="center subtle">Nenhum processo encontrado.</p>
            )}
          </div>
        ) : (
          <Empty title="Conecte-se ao seu computador">
            As métricas e os processos reais ficam disponíveis no aplicativo
            desktop.
          </Empty>
        )}
        <div className="table-footer">
          Exibindo até 100 processos. A CPU de processos é normalizada pelo
          número de núcleos. O encerramento exige confirmação; processos
          essenciais são protegidos.
        </div>
      </section>
      {opened && (
        <Dialog
          title={
            confirmation
              ? "Confirmar encerramento"
              : (details?.name ?? "Detalhes do processo")
          }
          close={() => {
            if (!ending) {
              inspection.current++;
              setOpened(false);
            }
          }}
        >
          {loading ? (
            <Busy>Consultando informações do processo…</Busy>
          ) : (
            <>
              {error && (
                <div role="alert" className="error-box">
                  {error}
                </div>
              )}
              {details &&
                (confirmation ? (
                  <>
                    <p>
                      Encerrar <strong>{details.name}</strong> (PID{" "}
                      {details.pid})?
                    </p>
                    <Notice>
                      O encerramento é forçado. Trabalhos não salvos podem ser
                      perdidos. Apenas este processo será encerrado.
                    </Notice>
                    <p className="process-path">
                      {details.path ?? "Caminho não disponível"}
                    </p>
                    <div className="dialog-actions">
                      <button
                        className="secondary"
                        disabled={ending}
                        onClick={() => setConfirmation(false)}
                      >
                        Voltar aos detalhes
                      </button>
                      <button
                        className="danger"
                        disabled={ending}
                        onClick={() => void terminate()}
                      >
                        {ending ? "Encerrando…" : "Confirmar encerramento"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      {details.description ??
                        "O executável não fornece uma descrição."}
                    </p>
                    <dl className="process-details">
                      {[
                        ["PID", String(details.pid)],
                        [
                          "Processo pai (PID)",
                          details.parentPid === null
                            ? "Não informado"
                            : String(details.parentPid),
                        ],
                        ["Produto", details.product ?? "Não informado"],
                        [
                          "Fabricante informado",
                          details.company ?? "Não informado",
                        ],
                        [
                          "Versão do arquivo",
                          details.fileVersion ?? "Não informada",
                        ],
                        [
                          "CPU na consulta",
                          `${details.cpu.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
                        ],
                        ["Memória na consulta", bytes(details.memory)],
                        [
                          "Estado",
                          (
                            {
                              Run: "Em execução",
                              Sleep: "Em espera",
                              Unknown: "Não informado",
                              Dead: "Encerrado",
                            } as Record<string, string>
                          )[details.status] ?? details.status,
                        ],
                        [
                          "Iniciado em",
                          details.startTime
                            ? new Date(details.startTime * 1000).toLocaleString(
                                "pt-BR",
                              )
                            : "Não informado",
                        ],
                        [
                          "Tempo em execução",
                          `${Math.floor(details.runTime / 3600)} h ${Math.floor(details.runTime / 60) % 60} min ${details.runTime % 60} s`,
                        ],
                        ["Executável", details.path ?? "Não disponível"],
                      ].map(([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {details.terminationBlock && (
                      <Notice>{details.terminationBlock}</Notice>
                    )}
                    <div className="dialog-actions">
                      <button
                        className="secondary"
                        disabled={!details.path}
                        onClick={() =>
                          void native
                            .openLocation(details.path!)
                            .catch((e) => setError(errorMessage(e)))
                        }
                      >
                        Abrir localização
                      </button>
                      <button
                        className="danger"
                        disabled={
                          !details.identity ||
                          !!details.terminationBlock ||
                          ending
                        }
                        onClick={() => setConfirmation(true)}
                      >
                        Encerrar processo…
                      </button>
                    </div>
                  </>
                ))}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
