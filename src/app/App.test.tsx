import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

vi.mock("../services/native", async (original) => ({
  ...(await original<typeof import("../services/native")>()),
  nativeAvailable: false,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it("navega pelas telas sem inventar métricas e persiste o tema claro", async () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByText(/Prévia no navegador/)).toBeTruthy();
  for (const name of [
    "Limpeza",
    "Armazenamento",
    "Desempenho",
    "Ferramentas",
  ]) {
    await user.click(screen.getByRole("button", { name }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  }
  await user.click(
    screen.getByRole("button", { name: "Assistente IA, em breve" }),
  );
  expect(
    screen.getByText("Nenhuma conexão com provedores nesta versão."),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Configurações" }));
  await user.click(screen.getByRole("button", { name: "Claro" }));
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(JSON.parse(localStorage.getItem("sweeply.preferences")!).theme).toBe(
    "light",
  );
});
