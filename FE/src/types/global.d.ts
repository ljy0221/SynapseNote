import type { ExecutionRequest, ExecutionResult } from './execution/ExecutionTypes';

declare global {
  interface Window {
    dockerAPI: {
      checkInstalled: () => Promise<boolean>;
      checkRunning: () => Promise<boolean>;
      executeSingle: (request: ExecutionRequest) => Promise<ExecutionResult>;
    };
    electronAPI: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openExternal: (url: string) => void;
    };
  }
}

export { };
