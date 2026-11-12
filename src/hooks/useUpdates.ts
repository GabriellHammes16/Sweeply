import { useCallback, useEffect, useRef, useState } from "react";
import { Channel, invoke } from "@tauri-apps/api/core";
import { nativeAvailable, errorMessage } from "../services/native";
import { version as appVersion } from "../../package.json";
export { appVersion };
export interface UpdateInfo {
  currentVersion: string;
  version: string | null;
  notes: string | null;
  published: boolean;
}
interface Progress {
  downloaded: number;
  total: number | null;
  installing: boolean;
}
export function useUpdates(automatic: boolean) {
  const [available, setAvailable] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const check = useCallback(async () => {
    if (!nativeAvailable || busy.current) return;
    busy.current = true;
    setChecking(true);
    setError("");
    try {
      const info = await invoke<UpdateInfo>("check_updates");
      setAvailable(info.version ? info : null);
      setStatus(
        info.version
          ? `Nova versão ${info.version} disponível.`
          : info.published
            ? "Você está usando a versão mais recente."
            : "Nenhuma versão de atualização publicada ainda.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }, []);
  const install = useCallback(async () => {
    if (!available?.version || busy.current) return;
    busy.current = true;
    setInstalling(true);
    setProgress(null);
    setError("");
    try {
      const channel = new Channel<Progress>();
      channel.onmessage = setProgress;
      await invoke("install_update", {
        version: available.version,
        confirmed: true,
        progress: channel,
      });
      setStatus(
        "O instalador foi iniciado. Reabra o Sweeply quando a instalação terminar.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setInstalling(false);
    }
  }, [available]);
  useEffect(() => {
    if (!automatic || !nativeAvailable) return;
    const first = window.setTimeout(() => void check(), 3000);
    const timer = window.setInterval(() => void check(), 6 * 60 * 60 * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [automatic, check]);
  return {
    available,
    checking,
    installing,
    progress,
    status,
    error,
    check,
    install,
  };
}
export type UpdatesState = ReturnType<typeof useUpdates>;
