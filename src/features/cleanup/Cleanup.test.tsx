import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cleanup } from "./Cleanup";
import { native } from "../../services/native";

vi.mock("../../services/native", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/native")>()),
  nativeAvailable: true,
  native: { scanCleanup: vi.fn(), clean: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("revisão de limpeza", () => {
  it("não seleciona arquivos nem exclui antes da confirmação explícita", async () => {
    const user = userEvent.setup();
    vi.mocked(native.scanCleanup).mockResolvedValue({
      id: "plan-1",
      files: [
        { id: 0, path: "C:\\Temp\\old.tmp", size: 1024, category: "user_temp" },
      ],
      total: 1024,
      skipped: 0,
      blocked: 0,
      warnings: [],
    });
    vi.mocked(native.clean).mockResolvedValue({
      freed: 1024,
      deleted: 1,
      skipped: 0,
      errors: [],
    });
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    render(<Cleanup />);
    await user.click(
      screen.getByRole("button", { name: "Analisar temporários" }),
    );
    const review = await screen.findByRole("button", {
      name: "Revisar e limpar",
    });
    expect((review as HTMLButtonElement).disabled).toBe(true);
    expect(native.clean).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("checkbox", { name: /Selecionar todos/ }),
    );
    await user.click(review);
    expect(native.clean).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Voltar à revisão" }));
    expect(native.clean).not.toHaveBeenCalled();
    await user.click(review);
    await user.click(
      screen.getByRole("button", { name: "Excluir arquivos selecionados" }),
    );
    expect(native.clean).toHaveBeenCalledExactlyOnceWith("plan-1", [0]);
    expect(await screen.findByText("Limpeza concluída")).toBeTruthy();
  });
  it("apresenta erro de análise sem oferecer exclusão", async () => {
    vi.mocked(native.scanCleanup).mockRejectedValue(new Error("Acesso negado"));
    render(<Cleanup />);
    await userEvent.click(
      screen.getByRole("button", { name: "Analisar temporários" }),
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Acesso negado",
    );
    expect(native.clean).not.toHaveBeenCalled();
  });
  it("mostra leitura vazia após limpar e retira resultados antigos se uma nova leitura falhar", async () => {
    const user = userEvent.setup();
    vi.mocked(native.scanCleanup)
      .mockResolvedValueOnce({
        id: "full",
        files: [
          { id: 0, path: "C:\\Temp\\old", size: 1, category: "user_temp" },
        ],
        total: 1,
        skipped: 0,
        blocked: 0,
        warnings: [],
      })
      .mockResolvedValueOnce({
        id: "empty",
        files: [],
        total: 0,
        skipped: 0,
        blocked: 0,
        warnings: [],
      })
      .mockRejectedValueOnce(new Error("Leitura indisponível"));
    vi.mocked(native.clean).mockResolvedValue({
      deleted: 1,
      freed: 1,
      skipped: 0,
      errors: [],
    });
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    render(<Cleanup />);
    await user.click(
      screen.getByRole("button", { name: "Analisar temporários" }),
    );
    expect(native.scanCleanup).toHaveBeenCalledWith([
      "user_temp",
      "windows_temp",
    ]);
    await user.click(
      await screen.findByRole("checkbox", { name: /Selecionar todos/ }),
    );
    await user.click(screen.getByRole("button", { name: "Revisar e limpar" }));
    await user.click(
      screen.getByRole("button", { name: "Excluir arquivos selecionados" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Analisar novamente" }),
    );
    expect(
      await screen.findByText("Nada para limpar nas pastas analisadas"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Revisar e limpar" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Refazer análise" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Leitura indisponível",
    );
    expect(
      screen.queryByText("Nada para limpar nas pastas analisadas"),
    ).toBeNull();
  });
});
