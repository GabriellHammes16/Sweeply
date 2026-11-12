import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, native, nativeAvailable } from "../services/native";
import type { SystemReport } from "../types/system";

export function useSystem() {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ cpu: number[]; ram: number[] }>({
    cpu: [],
    ram: [],
  });
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (!nativeAvailable || busy.current) return;
    busy.current = true;
    try {
      const next = await native.system();
      setReport(next);
      setError("");
      setHistory((h) => ({
        cpu: [...h.cpu.slice(-29), next.cpu],
        ram: [
          ...h.ram.slice(-29),
          next.memoryTotal ? (next.memoryUsed / next.memoryTotal) * 100 : 0,
        ],
      }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
    }
  }, []);
  useEffect(() => {
    // A leitura nativa só atualiza estado depois do await; não há atualização síncrona neste efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  return { report, error, history, refresh };
}
