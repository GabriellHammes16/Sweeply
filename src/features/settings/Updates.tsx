import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, Notice } from "../../design-system/ui";
import { bytes, nativeAvailable } from "../../services/native";
import type { UpdatesState } from "../../hooks/useUpdates";
export function UpdateAction({ updates }: { updates: UpdatesState }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button
        className="primary"
        disabled={updates.installing || updates.checking}
        onClick={() => setConfirm(true)}
      >
        <Download size={16} />
        {updates.installing ? "Atualizando…" : "Atualizar"}
      </button>
      {confirm && (
        <Dialog
          title="Instalar atualização"
          close={() => {
            if (!updates.installing) setConfirm(false);
          }}
        >
          <p>Instalar o Sweeply {updates.available?.version}?</p>
          <Notice>
            O aplicativo será fechado durante a instalação. As análises
            guardadas nesta sessão serão descartadas. Salve o que precisar e
            conclua ou cancele operações em andamento.
          </Notice>
          {updates.available?.notes && (
            <details>
              <summary>Novidades desta versão</summary>
              <p className="release-notes">{updates.available.notes}</p>
            </details>
          )}
          {updates.error && (
            <p className="error-box" role="alert">
              {updates.error}
            </p>
          )}
          {updates.installing && (
            <p role="status">
              {updates.progress?.installing
                ? "Download concluído. Verificando e iniciando instalação…"
                : updates.progress
                  ? `Baixando ${bytes(updates.progress.downloaded)}${updates.progress.total ? ` de ${bytes(updates.progress.total)}` : ""}…`
                  : "Preparando download…"}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={updates.installing}
              onClick={() => setConfirm(false)}
            >
              Agora não
            </button>
            <button
              className="primary"
              disabled={updates.installing}
              onClick={() => void updates.install()}
            >
              Instalar atualização
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
export function UpdatesPanel({
  updates,
  automatic,
  change,
}: {
  updates: UpdatesState;
  automatic: boolean;
  change: (enabled: boolean) => void;
}) {
  return (
    <section className="panel settings-panel">
      <h2>
        <Download size={19} /> Atualizações
      </h2>
      <label className="setting-row">
        <span>
          Avisar quando houver uma nova versão
          <small>
            Consulta o GitHub ao abrir e a cada 6 horas. Não envia análises nem
            caminhos de arquivos.
          </small>
        </span>
        <input
          className="switch"
          type="checkbox"
          role="switch"
          checked={automatic}
          onChange={(e) => change(e.target.checked)}
        />
      </label>
      <div className="updates-actions">
        <button
          className="secondary"
          disabled={!nativeAvailable || updates.checking || updates.installing}
          onClick={() => void updates.check()}
        >
          {updates.checking ? "Verificando…" : "Verificar agora"}
        </button>
        {updates.available && <UpdateAction updates={updates} />}
      </div>
      <p className="subtle" role="status">
        {nativeAvailable
          ? updates.status
          : "Verificação disponível no aplicativo desktop."}
      </p>
      {updates.error && (
        <p role="alert" className="error-box">
          {updates.error}
        </p>
      )}
      <p className="subtle">
        Atualizações assinadas, instaladas somente após confirmação.
      </p>
    </section>
  );
}
