import {
  ArrowRight,
  Check,
  Cpu,
  HardDrive,
  MemoryStick,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Ring, Notice } from "../../design-system/ui";
import { bytes, nativeAvailable } from "../../services/native";
import type { SystemReport } from "../../types/system";

export function Dashboard({
  report,
  go,
}: {
  report: SystemReport | null;
  go: (page: string) => void;
}) {
  const disk =
    report?.disks.find((d) => d.mount.toLowerCase().startsWith("c:")) ??
    report?.disks[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU ESPAÇO, EM ORDEM</span>
          <h1>
            Um pouco de cuidado.
            <br />
            <span>Um PC mais leve.</span>
          </h1>
          <p>Entenda seu computador e cuide do que importa.</p>
        </div>
        <div className="computer-tag">
          <span className="status-dot" />
          <span>
            {report?.hostname ?? "Este computador"}
            <small>{report?.os ?? "Windows 10 e 11"}</small>
          </span>
        </div>
      </div>
      {!nativeAvailable && (
        <Notice>
          Prévia no navegador. Abra o aplicativo desktop para ler as métricas e
          analisar arquivos reais.
        </Notice>
      )}
      <section className="overview panel" aria-labelledby="overview-title">
        <div className="section-top">
          <h2 id="overview-title">Agora, no seu PC</h2>
          <span className="subtle">
            <span className={`status-dot ${report ? "" : "muted"}`} />
            {report
              ? "Atualização a cada 2 s"
              : "Aguardando aplicativo desktop"}
          </span>
        </div>
        <div className="metrics">
          <Ring
            label="Processador"
            value={report?.cpu ?? null}
            color="var(--cpu)"
            detail={report?.cpuName ?? "Uso em tempo real"}
          />
          <Ring
            label="Memória"
            value={
              report ? (report.memoryUsed / report.memoryTotal) * 100 : null
            }
            color="var(--ram)"
            detail={
              report
                ? `${bytes(report.memoryUsed)} de ${bytes(report.memoryTotal)}`
                : "Memória em uso / total"
            }
          />
          <Ring
            label="Armazenamento"
            value={
              disk ? ((disk.total - disk.available) / disk.total) * 100 : null
            }
            color="var(--storage)"
            detail={
              disk
                ? `${bytes(disk.available)} livres de ${bytes(disk.total)}`
                : "Espaço utilizado no disco"
            }
          />
        </div>
        <div className="overview-bottom">
          <ShieldCheck size={17} />
          <span>Análises locais. Seus arquivos ficam com você.</span>
          <button className="text-button" onClick={() => go("performance")}>
            Ver desempenho <ArrowRight size={15} />
          </button>
        </div>
      </section>
      <section className="analysis-banner">
        <div className="scan-symbol">
          <ScanLine size={31} />
        </div>
        <div>
          <h2>Vamos abrir espaço?</h2>
          <p>Encontre temporários antigos. Revise tudo antes de limpar.</p>
          <span className="quiet-note">
            <Check size={13} /> Nada é apagado durante a análise
          </span>
        </div>
        <button className="primary" onClick={() => go("cleanup")}>
          Analisar PC <ArrowRight size={17} />
        </button>
      </section>
      <div className="section-top quick-heading">
        <h2>Seu computador, por inteiro</h2>
        <span className="subtle">Um lugar para cada cuidado</span>
      </div>
      <div className="quick-links">
        {[
          {
            page: "storage",
            icon: HardDrive,
            title: "Encontre o que ocupa espaço",
            text: "Explore suas pastas, do maior ao menor.",
            color: "var(--storage)",
          },
          {
            page: "performance",
            icon: Cpu,
            title: "Veja o que está em uso",
            text: "CPU, memória e processos, sem mistério.",
            color: "var(--cpu)",
          },
          {
            page: "tools",
            icon: MemoryStick,
            title: "Cuide dos detalhes",
            text: "Acesse as ferramentas do Windows.",
            color: "var(--ram)",
          },
        ].map(({ page, icon: Icon, title, text, color }) => (
          <button className="quick-link" key={page} onClick={() => go(page)}>
            <Icon size={22} style={{ color }} />
            <h3>{title}</h3>
            <p>{text}</p>
            <ArrowRight size={17} className="link-arrow" />
          </button>
        ))}
      </div>
    </>
  );
}
