import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  native,
  nativeAvailable,
  bytes,
  errorMessage,
} from "../../services/native";
import type { RecycleBinStatus } from "../../types/system";

export function RecycleBin() {
  const [status, setStatus] = useState<RecycleBinStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(empty: boolean) {
    setBusy(true);
    setError("");
    try {
      setStatus(await (empty ? native.emptyRecycleBin() : native.recycleBin()));
    } catch (e) {
      setStatus(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel recycle-panel">
      <div className="section-top">
        <h2>
          <Trash2 size={18} /> Lixeira
        </h2>
        <span className="tag">Operação separada</span>
      </div>
      <p>
        Conteúdo da sua Lixeira em todas as unidades. O Windows pedirá
        confirmação antes da exclusão permanente.
      </p>
      {status && (
        <p role="status">
          {status.count === 0
            ? "A Lixeira está vazia."
            : `${status.count} itens · ${bytes(status.size)}`}
        </p>
      )}
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <div className="catalog-row">
        <button
          className="secondary"
          disabled={!nativeAvailable || busy}
          onClick={() => void run(false)}
        >
          {busy ? "Aguarde…" : "Consultar Lixeira"}
        </button>
        <button
          className="secondary"
          disabled={!nativeAvailable || busy || !status?.count}
          onClick={() => void run(true)}
        >
          Esvaziar Lixeira…
        </button>
      </div>
    </section>
  );
}
