import {
  MonitorCog,
  ScanSearch,
  ShieldCheck,
  Network,
  Download,
  HardDrive,
  ArrowUpRight,
} from "lucide-react";
import { Notice } from "../../design-system/ui";
import { native, nativeAvailable, errorMessage } from "../../services/native";
import type { ToolId } from "../../types/system";
const tools: {
  id: ToolId;
  icon: typeof MonitorCog;
  title: string;
  description: string;
  action: string;
  color: string;
}[] = [
  {
    id: "startup",
    icon: MonitorCog,
    title: "Aplicativos de inicialização",
    description: "Escolha o que inicia junto com o Windows.",
    action: "Gerenciar",
    color: "var(--ram)",
  },
  {
    id: "diagnostics",
    icon: ScanSearch,
    title: "Diagnóstico do sistema",
    description: "Abra os solucionadores de problemas oficiais do Windows.",
    action: "Abrir diagnóstico",
    color: "var(--storage)",
  },
  {
    id: "security",
    icon: ShieldCheck,
    title: "Segurança do Windows",
    description: "Consulte o Microsoft Defender e as opções de proteção.",
    action: "Verificar",
    color: "var(--cpu)",
  },
  {
    id: "updates",
    icon: Download,
    title: "Atualizações do Windows",
    description: "Consulte o estado das atualizações do sistema.",
    action: "Ver atualizações",
    color: "var(--ram)",
  },
  {
    id: "network",
    icon: Network,
    title: "Rede e conectividade",
    description: "Veja suas conexões e os diagnósticos disponíveis.",
    action: "Abrir rede",
    color: "var(--storage)",
  },
  {
    id: "storage",
    icon: HardDrive,
    title: "Manutenção de armazenamento",
    description: "Acesse as recomendações de limpeza do próprio Windows.",
    action: "Abrir armazenamento",
    color: "var(--cpu)",
  },
];
export function Tools({ notify }: { notify: (text: string) => void }) {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">O CUIDADO VAI ALÉM DA LIMPEZA</span>
          <h1>Ferramentas</h1>
          <p>Atalhos diretos para os controles do seu Windows.</p>
        </div>
      </div>
      <div className="tool-list">
        {tools.map(({ id, icon: Icon, title, description, action, color }) => (
          <section className="panel tool-row" key={id}>
            <span className="tool-icon" style={{ color }}>
              <Icon size={25} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <button
              className="secondary"
              disabled={!nativeAvailable}
              onClick={() =>
                void native.openTool(id).catch((e) => notify(errorMessage(e)))
              }
            >
              {action}
              <ArrowUpRight size={15} />
            </button>
          </section>
        ))}
      </div>
      <Notice>
        Os atalhos abrem ferramentas oficiais. O Sweeply não altera
        configurações nem executa reparos automaticamente. SFC, DISM e
        alterações de inicialização dentro do app ainda não estão implementados.
      </Notice>
    </>
  );
}
