import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Performance } from "./Performance";
import { native } from "../../services/native";
import type { ProcessDetails, SystemReport } from "../../types/system";

vi.mock("../../services/native", async (original) => ({
  ...(await original<typeof import("../../services/native")>()),
  native: {
    processDetails: vi.fn(),
    terminateProcess: vi.fn(),
    openLocation: vi.fn(),
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const details: ProcessDetails = {
  pid: 501,
  name: "editor.exe",
  path: "C:\\Apps\\editor.exe",
  cpu: 2,
  memory: 1024,
  parentPid: 100,
  startTime: 1700000000,
  runTime: 120,
  status: "Run",
  identity: "123456789",
  terminationBlock: null,
  description: "Editor de arquivos de teste",
  company: "Exemplo",
  product: "Editor",
  fileVersion: "1.2.3",
};
const report: SystemReport = {
  hostname: "PC",
  os: "Windows",
  cpuName: "CPU",
  cpu: 2,
  memoryUsed: 1024,
  memoryTotal: 2048,
  uptime: 120,
  disks: [],
  processes: [details],
};
function mount() {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(
    <Performance
      report={report}
      history={{ cpu: [], ram: [] }}
      refresh={refresh}
    />,
  );
  return refresh;
}
it("mostra detalhes reais e só encerra a identidade revisada após confirmação", async () => {
  vi.mocked(native.processDetails).mockResolvedValue(details);
  vi.mocked(native.terminateProcess).mockResolvedValue("Processo encerrado.");
  const refresh = mount();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Detalhes de editor.exe (PID 501)" }),
  );
  expect(await screen.findByText("Editor de arquivos de teste")).toBeTruthy();
  expect(screen.getByText("1.2.3")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Encerrar processo…" }));
  expect(native.terminateProcess).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Voltar aos detalhes" }));
  expect(native.terminateProcess).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Encerrar processo…" }));
  await user.click(
    screen.getByRole("button", { name: "Confirmar encerramento" }),
  );
  expect(await screen.findByText("Processo encerrado.")).toBeTruthy();
  expect(native.terminateProcess).toHaveBeenCalledExactlyOnceWith(
    501,
    "123456789",
  );
  expect(refresh).toHaveBeenCalledOnce();
});
it("bloqueia encerramento quando o backend identifica um processo protegido", async () => {
  vi.mocked(native.processDetails).mockResolvedValue({
    ...details,
    terminationBlock: "Processo essencial protegido.",
  });
  mount();
  await userEvent.click(
    screen.getByRole("button", { name: "Encerrar editor.exe (PID 501)" }),
  );
  expect(await screen.findByText("Processo essencial protegido.")).toBeTruthy();
  expect(
    (
      screen.getByRole("button", {
        name: "Encerrar processo…",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(native.terminateProcess).not.toHaveBeenCalled();
});
it("mostra erro para processo encerrado e não permite confirmar dados antigos", async () => {
  vi.mocked(native.processDetails).mockRejectedValue(
    new Error("O processo já foi encerrado."),
  );
  mount();
  await userEvent.click(
    screen.getByRole("button", { name: "Encerrar editor.exe (PID 501)" }),
  );
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "O processo já foi encerrado.",
  );
  expect(
    screen.queryByRole("button", { name: "Confirmar encerramento" }),
  ).toBeNull();
  expect(native.terminateProcess).not.toHaveBeenCalled();
});
