import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { native } from "../services/native";
import type { CleanupPlan } from "../types/system";

vi.mock("../services/native", async (original) => ({
  ...(await original<typeof import("../services/native")>()),
  nativeAvailable: true,
  native: { scanCleanup: vi.fn(), clean: vi.fn() },
}));
vi.mock("../hooks/useSystem", () => ({
  useSystem: () => ({
    report: null,
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
const plan: CleanupPlan = {
  id: "reviewed-plan",
  files: [
    { id: 0, path: "C:\\Temp\\old.tmp", size: 1024, category: "user_temp" },
  ],
  total: 1024,
  skipped: 0,
  blocked: 0,
  warnings: [],
};
function mount() {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  render(<App />);
}
it("preserva plano e seleção ao ir para Armazenamento e voltar, sem excluir automaticamente", async () => {
  vi.mocked(native.scanCleanup).mockResolvedValue(plan);
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Limpeza" }));
  await user.click(
    screen.getByRole("button", { name: "Analisar temporários" }),
  );
  await user.click(
    await screen.findByRole("checkbox", { name: /Selecionar todos/ }),
  );
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  await user.click(screen.getByRole("button", { name: "Limpeza" }));
  expect(
    (
      screen.getByRole("checkbox", {
        name: /Selecionar todos/,
      }) as HTMLInputElement
    ).checked,
  ).toBe(true);
  expect(
    (
      screen.getByRole("button", {
        name: "Revisar e limpar",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  expect(native.scanCleanup).toHaveBeenCalledTimes(1);
  expect(native.clean).not.toHaveBeenCalled();
});
it("preserva análise pendente e recebe o resultado enquanto outra aba está aberta", async () => {
  let finish!: (value: CleanupPlan) => void;
  vi.mocked(native.scanCleanup).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Limpeza" }));
  await user.click(
    screen.getByRole("button", { name: "Analisar temporários" }),
  );
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  await act(async () => finish(plan));
  await user.click(screen.getByRole("button", { name: "Limpeza" }));
  expect(
    await screen.findByRole("checkbox", { name: /Selecionar todos/ }),
  ).toBeTruthy();
  expect(native.scanCleanup).toHaveBeenCalledTimes(1);
});
it("preserva o relatório final ao voltar de outra aba sem repetir a exclusão", async () => {
  vi.mocked(native.scanCleanup).mockResolvedValue(plan);
  vi.mocked(native.clean).mockResolvedValue({
    deleted: 1,
    freed: 1024,
    skipped: 0,
    errors: [],
  });
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Limpeza" }));
  await user.click(
    screen.getByRole("button", { name: "Analisar temporários" }),
  );
  await user.click(
    await screen.findByRole("checkbox", { name: /Selecionar todos/ }),
  );
  await user.click(screen.getByRole("button", { name: "Revisar e limpar" }));
  await user.click(
    screen.getByRole("button", { name: "Excluir arquivos selecionados" }),
  );
  expect(await screen.findByText("Limpeza concluída")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Armazenamento" }));
  await user.click(screen.getByRole("button", { name: "Limpeza" }));
  expect(screen.getByText("Limpeza concluída")).toBeTruthy();
  expect(native.clean).toHaveBeenCalledExactlyOnceWith("reviewed-plan", [0]);
});
