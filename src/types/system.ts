export interface Disk {
  name: string;
  mount: string;
  total: number;
  available: number;
  kind: string;
}
export interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  path: string | null;
}
export interface ProcessDetails extends Process {
  parentPid: number | null;
  startTime: number;
  runTime: number;
  status: string;
  identity: string | null;
  terminationBlock: string | null;
  description: string | null;
  company: string | null;
  fileVersion: string | null;
  product: string | null;
}
export interface SystemReport {
  hostname: string;
  os: string;
  cpuName: string;
  cpu: number;
  memoryUsed: number;
  memoryTotal: number;
  uptime: number;
  disks: Disk[];
  processes: Process[];
}
export interface CleanupFile {
  id: number;
  path: string;
  size: number;
  category: CleanupCategory;
}
export type CleanupCategory = "user_temp" | "windows_temp" | "prefetch";
export interface RecycleBinStatus {
  count: number;
  size: number;
}
export interface CleanupPlan {
  id: string;
  files: CleanupFile[];
  total: number;
  skipped: number;
  blocked: number;
  warnings: string[];
}
export interface CleanupResult {
  deleted: number;
  freed: number;
  skipped: number;
  errors: string[];
}
export interface StorageNode {
  name: string;
  path: string;
  size: number;
  children: StorageNode[];
  protected: boolean;
}
export interface StorageReport {
  root: StorageNode;
  skipped: number;
  cancelled: boolean;
  visited: number;
}
export interface StorageProgress {
  visited: number;
  files: number;
  folders: number;
  bytes: number;
  skipped: number;
  currentFolder: string;
  elapsedSeconds: number;
}
export type ToolId =
  "startup" | "security" | "updates" | "network" | "storage" | "diagnostics";
