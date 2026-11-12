import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Storage } from "./Storage";
import { native } from "../../services/native";
import type { StorageReport } from "../../types/system";

vi.mock("../../services/native", async (original) => ({
  ...(await original<typeof import("../../services/native")>()),
  nativeAvailable: true,
  native: {
    storage: vi.fn(),
    storageProgress: vi.fn(),
    cancelStorage: vi.fn().mockResolvedValue(undefined),
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function mount() {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) =>
    window.clearTimeout(id),
  );
  return render(
    <Storage
      disks={[
        { name: "C:", mount: "C:\\", total: 100, available: 50, kind: "SSD" },
        { name: "D:", mount: "D:\\", total: 100, available: 50, kind: "HDD" },
      ]}
      notify={vi.fn()}
    />,
  );
}
it("continua além de 20 segundos, exibe o andamento real e identifica o cancelamento parcial", async () => {
  let finish!: (report: StorageReport) => void;
  vi.mocked(native.storage).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.mocked(native.storageProgress).mockResolvedValue({
    visited: 153123,
    files: 150123,
    folders: 3000,
    bytes: 1024,
    skipped: 7,
    currentFolder: "C:\\Dados",
    elapsedSeconds: 25,
  });
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Analisar unidade" }));
  expect(
    await screen.findByText("150.123", {}, { timeout: 3000 }),
  ).toBeTruthy();
  expect(screen.getByText("0 min 25 s")).toBeTruthy();
  expect(screen.queryByText(/limitada a 20 segundos/)).toBeNull();
  await user.click(screen.getByRole("button", { name: "Cancelar análise" }));
  expect(native.cancelStorage).toHaveBeenCalledWith(
    vi.mocked(native.storage).mock.calls[0][1],
  );
  await act(async () =>
    finish({
      root: {
        name: "C:",
        path: "C:\\",
        size: 1024,
        children: [],
        protected: false,
      },
      visited: 153123,
      skipped: 7,
      cancelled: true,
    }),
  );
  expect(
    await screen.findByText(/Análise cancelada: resultado parcial/),
  ).toBeTruthy();
});
it("cancela somente sua própria leitura quando o componente é desmontado", async () => {
  vi.mocked(native.storage).mockImplementation(() => new Promise(() => {}));
  const view = mount();
  await userEvent.click(
    screen.getByRole("button", { name: "Analisar unidade" }),
  );
  const scanId = vi.mocked(native.storage).mock.calls[0][1];
  view.unmount();
  expect(native.cancelStorage).toHaveBeenCalledExactlyOnceWith(scanId);
});
it("restaura resultados por unidade sem novo scan e permite descartar esse cache", async () => {
  const result = (name: string): StorageReport => ({
    root: {
      name,
      path: name,
      size: 50,
      protected: false,
      children: [
        {
          name: `Pasta ${name}`,
          path: `${name}\\pasta`,
          size: 50,
          protected: false,
          children: [],
        },
      ],
    },
    visited: 2,
    skipped: 0,
    cancelled: false,
  });
  vi.mocked(native.storage)
    .mockResolvedValueOnce(result("C"))
    .mockResolvedValueOnce(result("D"));
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Analisar unidade" }));
  expect(
    await screen.findByRole("button", { name: "Pasta C, 50 bytes" }),
  ).toBeTruthy();
  const selector = screen.getByRole("combobox", { name: "Unidade" });
  await user.selectOptions(selector, "D:\\");
  expect(native.storage).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Analisar unidade" }));
  expect(
    await screen.findByRole("button", { name: "Pasta D, 50 bytes" }),
  ).toBeTruthy();
  await user.selectOptions(selector, "C:\\");
  expect(
    await screen.findByRole("button", { name: "Pasta C, 50 bytes" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Analisar novamente" }),
  ).toBeTruthy();
  expect(native.storage).toHaveBeenCalledTimes(2);
  await user.click(
    screen.getByRole("checkbox", {
      name: "Guardar resultados ao trocar de unidade nesta sessão",
    }),
  );
  await user.selectOptions(selector, "D:\\");
  expect(
    screen.queryByRole("button", { name: "Pasta D, 50 bytes" }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Analisar unidade" })).toBeTruthy();
  expect(native.storage).toHaveBeenCalledTimes(2);
});
