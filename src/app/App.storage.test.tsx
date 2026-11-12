import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { native } from "../services/native";
import type { StorageReport } from "../types/system";

vi.mock("../services/native", async (original) => ({
  ...(await original<typeof import("../services/native")>()),
  nativeAvailable: true,
  native: {
    storage: vi.fn(),
    storageProgress: vi.fn().mockResolvedValue(null),
    cancelStorage: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("../hooks/useSystem", () => ({
  useSystem: () => ({
    report: {
      hostname: "PC",
      os: "Windows",
      cpuName: "CPU",
      cpu: 1,
      memoryUsed: 1,
      memoryTotal: 2,
      uptime: 10,
      processes: [],
      disks: [
        { name: "C:", mount: "C:\\", total: 100, available: 50, kind: "SSD" },
      ],
    },
    history: { cpu: [], ram: [] },
    error: "",
    refresh: vi.fn(),
  }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
const result: StorageReport = {
  root: {
    name: "C:",
    path: "C:\\",
    size: 50,
    protected: false,
    children: [
      {
        name: "Projetos",
        path: "C:\\Projetos",
        size: 50,
        protected: false,
        children: [
          {
            name: "arquivo.txt",
            path: "C:\\Projetos\\arquivo.txt",
            size: 50,
            protected: false,
            children: [],
          },
        ],
      },
    ],
  },
  visited: 3,
  skipped: 0,
  cancelled: false,
};
function mount() {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) =>
    window.clearTimeout(id),
  );
  render(<App />);
}
it("preserva o resultado e a pasta aberta ao visitar Desempenho e voltar", async () => {
  vi.mocked(native.storage).mockResolvedValue(result);
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  await user.click(screen.getByRole("button", { name: "Analisar unidade" }));
  await user.click(
    await screen.findByRole("button", { name: "Projetos, 50 bytes" }),
  );
  expect(
    await screen.findByRole("button", { name: "Voltar ao nível anterior" }),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Desempenho" }));
  expect(screen.queryByRole("heading", { name: "Armazenamento" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  expect(
    screen.getByRole("button", { name: "Voltar ao nível anterior" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "arquivo.txt, 50 bytes" }),
  ).toBeTruthy();
  expect(native.storage).toHaveBeenCalledTimes(1);
});
it("mantém a leitura em andamento enquanto visita outra aba", async () => {
  let finish!: (report: StorageReport) => void;
  vi.mocked(native.storage).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  await user.click(screen.getByRole("button", { name: "Analisar unidade" }));
  await user.click(screen.getByRole("button", { name: "Desempenho" }));
  expect(native.cancelStorage).not.toHaveBeenCalled();
  await act(async () => finish(result));
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  expect(
    await screen.findByRole("button", { name: "Projetos, 50 bytes" }),
  ).toBeTruthy();
  expect(native.storage).toHaveBeenCalledTimes(1);
});
