import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  CleanupPlan,
  CleanupResult,
  CleanupCategory,
  RecycleBinStatus,
  ProcessDetails,
  StorageReport,
  StorageProgress,
  SystemReport,
  ToolId,
} from "../types/system";

export const nativeAvailable = isTauri();
export const native = {
  system: () => invoke<SystemReport>("system_snapshot"),
  processDetails: (pid: number) =>
    invoke<ProcessDetails>("process_details", { pid }),
  terminateProcess: (pid: number, identity: string) =>
    invoke<string>("terminate_process", { pid, identity, confirmed: true }),
  scanCleanup: (categories: CleanupCategory[]) =>
    invoke<CleanupPlan>("scan_cleanup", { categories }),
  recycleBin: () => invoke<RecycleBinStatus>("recycle_bin_status"),
  emptyRecycleBin: () => invoke<RecycleBinStatus>("empty_recycle_bin"),
  clean: (planId: string, ids: number[]) =>
    invoke<CleanupResult>("execute_cleanup", { planId, ids }),
  storage: (mount: string, scanId: string) =>
    invoke<StorageReport>("scan_storage", { mount, scanId }),
  storageProgress: (scanId: string) =>
    invoke<StorageProgress | null>("storage_progress", { scanId }),
  cancelStorage: (scanId: string) => invoke<void>("cancel_storage", { scanId }),
  openTool: (tool: ToolId) => invoke<void>("open_windows_tool", { tool }),
  openLocation: (path: string) => invoke<void>("open_location", { path }),
};
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
export function bytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), 4);
  return `${(value / 1024 ** unit).toLocaleString("pt-BR", { maximumFractionDigits: unit > 1 ? 1 : 0 })} ${["B", "KB", "MB", "GB", "TB"][unit]}`;
}
