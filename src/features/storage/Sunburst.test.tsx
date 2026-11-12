import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { layout } from "./Sunburst";
import { Storage } from "./Storage";
import { native } from "../../services/native";
import type { StorageNode } from "../../types/system";

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
  vi.unstubAllGlobals();
});
const file: StorageNode = {
  name: "arquivo.bin",
  path: "C:\\Dados\\arquivo.bin",
  size: 80,
  children: [],
  protected: false,
};
const folder: StorageNode = {
  name: "Dados",
  path: "C:\\Dados",
  size: 80,
  children: [file],
  protected: false,
};
const root: StorageNode = {
  name: "C:",
  path: "C:\\",
  size: 100,
  children: [
    folder,
    {
      name: "Outro",
      path: "C:\\Outro",
      size: 20,
      children: [],
      protected: false,
    },
  ],
  protected: false,
};
it("mantém proporções reais e desloca o subnível para o anel interno ao ampliar", () => {
  const overview = layout(root),
    zoomed = layout(folder);
  expect(
    (overview[0].end - overview[0].start) / (Math.PI * 2 - 0.001),
  ).toBeCloseTo(0.8);
  expect(overview.find((s) => s.node === file)!.inner).toBe(136);
  expect(zoomed[0].inner).toBe(92);
  expect(zoomed[0].end - zoomed[0].start).toBeCloseTo(Math.PI * 2 - 0.001);
});
it("amplia pelo setor e volta pelo centro, respeitando movimento reduzido", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) =>
    window.clearTimeout(id),
  );
  vi.mocked(native.storage).mockResolvedValue({
    root,
    visited: 4,
    skipped: 0,
    cancelled: false,
  });
  const user = userEvent.setup();
  render(
    <Storage
      disks={[
        { name: "C:", mount: "C:\\", total: 100, available: 0, kind: "SSD" },
      ]}
      notify={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Analisar unidade" }));
  await user.click(
    await screen.findByRole("button", { name: "Dados, 80 bytes" }),
  );
  const back = await screen.findByRole("button", {
    name: "Voltar ao nível anterior",
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Outro, 20 bytes" }),
    ).toBeNull(),
  );
  expect(
    screen
      .getByRole("button", { name: "arquivo.bin, 80 bytes" })
      .getAttribute("d"),
  ).not.toMatch(/NaN|undefined/);
  await user.click(back);
  expect(
    await screen.findByRole("button", { name: "Outro, 20 bytes" }),
  ).toBeTruthy();
});
