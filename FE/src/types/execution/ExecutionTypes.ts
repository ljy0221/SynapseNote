export type Language = 'python' | 'javascript' | 'java';
export type ExecutionStatus = 'success' | 'error' | 'timeout';

export interface ExecutionRequest {
  blockId: string;
  language: Language;
  version: string;
  code: string;
  timeout?: number; // default 5000ms
}

export interface ExecutionResult {
  blockId: string;
  output: string;
  error: string | null;
  executionTime: number; // ms
  exitCode: number;
  status: ExecutionStatus;
}
