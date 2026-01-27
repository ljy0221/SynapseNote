import type { ExecutionRequest, ExecutionResult, SessionExecutionResult, SessionInfo, Language } from './execution/ExecutionTypes';

declare global {
  interface Window {
    dockerAPI: {
      checkInstalled: () => Promise<boolean>;
      checkRunning: () => Promise<boolean>;

      // NEW: 통합 실행
      execute: (request: ExecutionRequest) => Promise<ExecutionResult | SessionExecutionResult>;

      // NEW: 세션 관리
      getSessionStatus: (noteId: string, language: Language) => Promise<SessionInfo | null>;
      destroySession: (noteId: string, language: Language) => Promise<void>;

      // 기존 호환성
      executeSingle: (request: ExecutionRequest) => Promise<ExecutionResult>;
    };
    electronAPI: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}

export {};
