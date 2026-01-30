export type Language = 'python' | 'javascript' | 'java';
export type ExecutionStatus = 'success' | 'error' | 'timeout';
export type ExecutionMode = 'single' | 'session';

export interface ExecutionRequest {
  blockId: string;
  language: Language;
  version: string;
  code: string;
  timeout?: number; // default 5000ms
  mode?: ExecutionMode; // NEW: 실행 모드 (default: 'single')
  noteId?: string; // NEW: 세션 모드 필수 (세션 키 생성용)
}

export interface ExecutionResult {
  blockId: string;
  output: string;
  error: string | null;
  executionTime: number; // ms
  exitCode: number;
  status: ExecutionStatus;
}

export interface SessionInfo {
  sessionId: string;
  noteId: string;
  language: Language;
  version: string;
  containerId: string;
  createdAt: number;
  lastActivityAt: number;
  status: 'active' | 'idle' | 'terminated';
}

export interface SessionExecutionResult extends ExecutionResult {
  sessionId: string | null;
  isSessionActive: boolean;
}
