export type AllowedAction = "scan_user_temp" | "scan_storage" | "read_system";
export interface AIProviderConfig {
  kind: "openai" | "anthropic" | "compatible" | "local";
  endpoint?: string;
}
export interface DiagnosticContext {
  consent: boolean;
  summary: string;
}
export interface SystemReport {
  summary: string;
  generatedAt: string;
}
export interface SuggestedAction {
  operation: AllowedAction;
  reason: string;
}
export interface ActionApproval {
  operation: AllowedAction;
  approved: boolean;
}
export interface ToolExecutionResult {
  operation: AllowedAction;
  success: boolean;
  message: string;
}
export interface AIProvider {
  explain(context: DiagnosticContext): Promise<string>;
}
