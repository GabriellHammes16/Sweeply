import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecycleBin } from "./RecycleBin";
import { native } from "../../services/native";

vi.mock("../../services/native", async (original) => ({
  ...(await original<typeof import("../../services/native")>()),
  nativeAvailable: true,
  native: { recycleBin: vi.fn(), emptyRecycleBin: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("consulta sem esvaziar e mostra vazio após a operação confirmada pelo Windows", async () => {
  vi.mocked(native.recycleBin).mockResolvedValue({ count: 2, size: 1024 });
  vi.mocked(native.emptyRecycleBin).mockResolvedValue({ count: 0, size: 0 });
  const user = userEvent.setup();
  render(<RecycleBin />);
  expect(
    (
      screen.getByRole("button", {
        name: "Esvaziar Lixeira…",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await user.click(screen.getByRole("button", { name: "Consultar Lixeira" }));
  expect(await screen.findByText("2 itens · 1 KB")).toBeTruthy();
  expect(native.emptyRecycleBin).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Esvaziar Lixeira…" }));
  expect(await screen.findByText("A Lixeira está vazia.")).toBeTruthy();
});
