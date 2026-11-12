import { useEffect, useState } from "react";
import {
  Home,
  Brush,
  HardDrive,
  Gauge,
  Wrench,
  Sparkles,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  ShieldCheck,
  X,
  Shapes,
} from "lucide-react";
import { useSystem } from "../hooks/useSystem";
import { Dashboard } from "../features/dashboard/Dashboard";
import { Cleanup } from "../features/cleanup/Cleanup";
import { Storage } from "../features/storage/Storage";
import { Performance } from "../features/performance/Performance";
import { Tools } from "../features/tools/Tools";
import { Assistant } from "../features/ai-assistant/Assistant";
import {
  Settings,
  loadPreferences,
  type Preferences,
} from "../features/settings/Settings";
import { Catalog } from "../features/settings/Catalog";
import { useUpdates, appVersion } from "../hooks/useUpdates";
import { UpdateAction } from "../features/settings/Updates";

const pages = [
  { id: "dashboard", title: "Início", icon: Home },
  { id: "cleanup", title: "Limpeza", icon: Brush },
  { id: "storage", title: "Armazenamento", icon: HardDrive },
  { id: "performance", title: "Desempenho", icon: Gauge },
  { id: "tools", title: "Ferramentas", icon: Wrench },
];
export default function App() {
  const [page, setPage] = useState(
    location.hash === "#design-system" ? "catalog" : "dashboard",
  );
  const [preferences, setPreferences] = useState(loadPreferences);
  const [toast, setToast] = useState("");
  const { report, error, history, refresh } = useSystem();
  const updates = useUpdates(preferences.autoUpdates);
  useEffect(() => {
    try {
      localStorage.setItem("sweeply.preferences", JSON.stringify(preferences));
    } catch {
      /* A sessão continua se o armazenamento local estiver indisponível. */
    }
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        preferences.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preferences.theme;
      document.documentElement.dataset.motion = preferences.motion
        ? "on"
        : "off";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function update(next: Preferences) {
    setPreferences(next);
  }
  const currentTitle =
    pages.find((p) => p.id === page)?.title ??
    (page === "assistant"
      ? "Assistente IA"
      : page === "catalog"
        ? "Design system"
        : "Configurações");
  return (
    <div className={`app ${preferences.collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        Ir para conteúdo
      </a>
      <aside className="sidebar">
        <div className="sidebar-caption">SEU COMPUTADOR</div>
        <nav aria-label="Navegação principal">
          {pages.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              aria-current={page === id ? "page" : undefined}
              title={preferences.collapsed ? title : undefined}
              onClick={() => setPage(id)}
            >
              <Icon size={20} />
              <span>{title}</span>
              {page === id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`assistant-nav ${page === "assistant" ? "active" : ""}`}
            onClick={() => setPage("assistant")}
            aria-label="Assistente IA, em breve"
          >
            <Sparkles size={19} />
            <span>Assistente IA</span>
            <small>Em breve</small>
          </button>
          <button
            className={page === "settings" ? "active" : ""}
            onClick={() => setPage("settings")}
            aria-label="Configurações"
          >
            <SettingsIcon size={19} />
            <span>Configurações</span>
          </button>
          <div className="sidebar-footer">
            <span>
              <span className="status-dot" />
              Tudo local. Tudo seu.
            </span>
            <button
              className="icon-button"
              aria-label={
                preferences.collapsed
                  ? "Expandir navegação"
                  : "Recolher navegação"
              }
              onClick={() =>
                update({ ...preferences, collapsed: !preferences.collapsed })
              }
            >
              {preferences.collapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span>{currentTitle}</span>
          </div>
          <div>
            <span className="local-label">
              <ShieldCheck size={14} /> Local e privado
            </span>
            <button
              className="icon-button"
              title="Catálogo de componentes"
              aria-label="Abrir catálogo de componentes"
              onClick={() => setPage("catalog")}
            >
              <Shapes size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Alternar tema"
              onClick={() =>
                update({
                  ...preferences,
                  theme:
                    document.documentElement.dataset.theme === "dark"
                      ? "light"
                      : "dark",
                })
              }
            >
              {preferences.theme === "light" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>
          </div>
        </header>
        {updates.available && (
          <div className="update-banner" role="status">
            <span>
              Uma nova versão do Sweeply está disponível:{" "}
              <strong>{updates.available.version}</strong>
            </span>
            <UpdateAction updates={updates} />
          </div>
        )}
        <main id="main" tabIndex={-1}>
          {error && (
            <div className="error-box" role="alert">
              Falha ao atualizar as métricas: {error}
            </div>
          )}
          {page === "dashboard" && <Dashboard report={report} go={setPage} />}
          <div hidden={page !== "cleanup"}>
            <Cleanup />
          </div>
          <div hidden={page !== "storage"}>
            <Storage disks={report?.disks ?? []} notify={setToast} />
          </div>
          {page === "performance" && (
            <Performance report={report} history={history} refresh={refresh} />
          )}
          {page === "tools" && <Tools notify={setToast} />}
          {page === "assistant" && <Assistant />}
          {page === "settings" && (
            <Settings
              preferences={preferences}
              update={update}
              updates={updates}
            />
          )}
          {page === "catalog" && <Catalog />}
        </main>
        <footer className="workspace-footer">
          <span>Seu PC, mais leve.</span>
          <span>
            Sweeply <span className="version">{appVersion}</span>
          </span>
        </footer>
      </div>
      {toast && (
        <div role="status" className="toast">
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
