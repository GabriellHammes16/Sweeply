import {
  Moon,
  Sun,
  Monitor,
  Palette,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Logo, Notice } from "../../design-system/ui";
import { UpdatesPanel } from "./Updates";
import { appVersion, type UpdatesState } from "../../hooks/useUpdates";
export interface Preferences {
  theme: "dark" | "light" | "system";
  motion: boolean;
  collapsed: boolean;
  autoUpdates: boolean;
}
export const defaults: Preferences = {
  theme: "dark",
  motion: true,
  collapsed: false,
  autoUpdates: true,
};
export function loadPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem("sweeply.preferences") ?? "{}");
    return {
      theme: ["dark", "light", "system"].includes(p.theme) ? p.theme : "dark",
      motion: typeof p.motion === "boolean" ? p.motion : true,
      collapsed: typeof p.collapsed === "boolean" ? p.collapsed : false,
      autoUpdates: typeof p.autoUpdates === "boolean" ? p.autoUpdates : true,
    };
  } catch {
    return defaults;
  }
}
export function Settings({
  preferences,
  update,
  updates,
}: {
  preferences: Preferences;
  update: (next: Preferences) => void;
  updates: UpdatesState;
}) {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">DO SEU JEITO</span>
          <h1>Configurações</h1>
          <p>Pequenos ajustes para se sentir em casa.</p>
        </div>
      </div>
      <section className="panel settings-panel">
        <h2>
          <Palette size={19} /> Aparência
        </h2>
        <div className="theme-options" role="group" aria-label="Tema">
          {[
            { id: "dark", title: "Escuro", icon: Moon },
            { id: "light", title: "Claro", icon: Sun },
            { id: "system", title: "Sistema", icon: Monitor },
          ].map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              className={`theme-option ${id} ${preferences.theme === id ? "selected" : ""}`}
              aria-pressed={preferences.theme === id}
              onClick={() =>
                update({ ...preferences, theme: id as Preferences["theme"] })
              }
            >
              <div className="theme-preview">
                <div className="preview-sidebar">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="preview-content">
                  <i />
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                  <i />
                </div>
              </div>
              <span>
                <Icon size={15} />
                {title}
                {preferences.theme === id && <Check size={15} />}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel settings-panel">
        <h2>
          <SlidersHorizontal size={19} /> Preferências
        </h2>
        <label className="setting-row">
          <span>
            Animações discretas
            <small>
              A preferência de movimento reduzido do sistema sempre tem
              prioridade.
            </small>
          </span>
          <input
            className="switch"
            type="checkbox"
            role="switch"
            checked={preferences.motion}
            onChange={(e) =>
              update({ ...preferences, motion: e.target.checked })
            }
          />
        </label>
        <div className="setting-row">
          <span>Idioma</span>
          <select aria-label="Idioma">
            <option>Português (Brasil)</option>
          </select>
        </div>
        <div className="setting-row">
          <span>
            Confirmar antes de limpar
            <small>
              A confirmação é obrigatória para proteger seus arquivos.
            </small>
          </span>
          <span className="tag">
            <ShieldCheck size={14} /> Sempre
          </span>
        </div>
      </section>
      <section className="panel settings-panel">
        <h2>
          <ShieldCheck size={19} /> Privacidade
        </h2>
        <p className="subtle">
          Sem conta, anúncios ou telemetria. Análises e preferências ficam neste
          computador. O histórico local de manutenção registra contagens, erros
          e PIDs, sem conteúdo ou nomes de arquivos.
        </p>
      </section>
      <section className="panel settings-panel">
        <h2>
          <Info size={19} /> Sobre
        </h2>
        <div className="about">
          <Logo wordmark />
          <span>
            {appVersion} · Prévia de desenvolvimento
            <br />
            <small>Gratuito · Código aberto · Licença MIT</small>
          </span>
        </div>
        <Notice>
          <a
            href="https://github.com/GabriellHammes16/Sweeply"
            target="_blank"
            rel="noreferrer"
          >
            Código-fonte no GitHub
          </a>
          . A versão portátil ainda precisa ser validada em um Windows limpo.
        </Notice>
        <details className="scope-details">
          <summary>Licenças e créditos</summary>
          <p>
            Código original Sweeply: MIT. React: MIT. Tauri: MIT/Apache-2.0.
          </p>
          <p>
            <a href="/licenses/Inter-OFL.txt" target="_blank" rel="noreferrer">
              Inter · SIL Open Font License
            </a>{" "}
            ·{" "}
            <a href="/licenses/Lucide.txt" target="_blank" rel="noreferrer">
              Lucide · ISC/MIT
            </a>
          </p>
        </details>
      </section>
      <UpdatesPanel
        updates={updates}
        automatic={preferences.autoUpdates}
        change={(autoUpdates) => update({ ...preferences, autoUpdates })}
      />
    </>
  );
}
