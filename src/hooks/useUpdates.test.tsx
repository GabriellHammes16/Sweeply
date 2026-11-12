import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { useUpdates } from "./useUpdates";

vi.mock("../services/native", async (original) => ({
  ...(await original<typeof import("../services/native")>()),
  nativeAvailable: true,
}));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => true,
  invoke: vi.fn(),
  Channel: class {
    onmessage: unknown;
  },
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
});

it("avisa automaticamente sem instalar e respeita a preferência desativada", async () => {
  vi.useFakeTimers();
  vi.mocked(invoke).mockResolvedValue({
    currentVersion: "0.1.0",
    version: "0.2.0",
    notes: "Melhorias",
    published: true,
  });
  const { result, rerender } = renderHook(
    ({ enabled }) => useUpdates(enabled),
    { initialProps: { enabled: false } },
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(invoke).not.toHaveBeenCalled();
  rerender({ enabled: true });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(result.current.available?.version).toBe("0.2.0");
  expect(invoke).toHaveBeenCalledExactlyOnceWith("check_updates");
});

it("distingue ausência de release de falha de conexão e permite tentar novamente", async () => {
  vi.mocked(invoke).mockRejectedValueOnce("Sem conexão").mockResolvedValueOnce({
    currentVersion: "0.1.0",
    version: null,
    notes: null,
    published: false,
  });
  const { result } = renderHook(() => useUpdates(false));
  await act(() => result.current.check());
  expect(result.current.error).toBe("Sem conexão");
  await act(() => result.current.check());
  expect(result.current.error).toBe("");
  expect(result.current.status).toMatch(/Nenhuma versão/);
  vi.mocked(invoke).mockResolvedValueOnce({
    currentVersion: "0.1.0",
    version: null,
    notes: null,
    published: true,
  });
  await act(() => result.current.check());
  expect(result.current.status).toMatch(/versão mais recente/);
});

it("só solicita instalação depois da chamada explícita e recebe progresso", async () => {
  vi.mocked(invoke).mockImplementation(async (command, args) => {
    if (command === "check_updates")
      return {
        currentVersion: "0.1.0",
        version: "0.2.0",
        notes: null,
        published: true,
      };
    const channel = (args as { progress: { onmessage: (p: unknown) => void } })
      .progress;
    channel.onmessage({ downloaded: 1024, total: 2048, installing: false });
    return undefined;
  });
  const { result } = renderHook(() => useUpdates(false));
  await act(() => result.current.check());
  expect(invoke).toHaveBeenCalledTimes(1);
  await act(() => result.current.install());
  await waitFor(() => expect(result.current.progress?.downloaded).toBe(1024));
  expect(invoke).toHaveBeenLastCalledWith(
    "install_update",
    expect.objectContaining({ version: "0.2.0", confirmed: true }),
  );
});
