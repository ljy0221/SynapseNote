import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ExecutionRequest, ExecutionResult, Language, SessionExecutionResult, SessionInfo } from '../../src/types/execution/ExecutionTypes';
import { DOCKER_SECURITY_CONFIG } from './SecurityConfig';
import { SessionManager } from './SessionManager';

export class DockerExecService {
  private sessionManager: SessionManager;

  constructor() {
    this.sessionManager = new SessionManager();
  }

  /**
   * 통합 실행 메서드 (모드 감지 후 라우팅)
   */
  async execute(request: ExecutionRequest): Promise<SessionExecutionResult> {
    if (request.mode === 'session') {
      return this.executeSession(request);
    }
    return this.executeSingle(request);
  }

  /**
   * 세션 모드 실행
   */
  private async executeSession(request: ExecutionRequest): Promise<SessionExecutionResult> {
    const startTime = Date.now();

    try {
      // 검증
      if (!request.noteId) {
        throw new Error('noteId is required for session mode');
      }
      if (request.language === 'java') {
        throw new Error('Session mode not supported for Java');
      }

      // 세션 생성 또는 재사용
      const sessionInfo = await this.sessionManager.createSession(
        request.noteId,
        request.language,
        request.version
      );

      // 실행
      const result = await this.sessionManager.executeInSession(
        request.noteId,
        request.language,
        request.code,
        request.timeout || 5000
      );

      const isSuccess = result.error === null;

      return {
        blockId: request.blockId,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        exitCode: isSuccess ? 0 : 1,
        status: isSuccess ? 'success' : 'error',
        sessionId: sessionInfo.sessionId,
        isSessionActive: true,
      };
    } catch (error: any) {
      console.error(`[Docker] Session execution failed:`, error.message);
      return {
        blockId: request.blockId,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: 'error',
        isSessionActive: false,
      };
    }
  }

  /**
   * 세션 상태 조회
   */
  getSessionStatus(noteId: string, language: Language): SessionInfo | null {
    return this.sessionManager.getSessionInfo(noteId, language);
  }

  /**
   * 세션 종료
   */
  async destroySession(noteId: string, language: Language): Promise<void> {
    return this.sessionManager.destroySession(noteId, language);
  }

  /**
   * 앱 종료 시 정리
   */
  async cleanup(): Promise<void> {
    return this.sessionManager.cleanupAll();
  }
  async executeSingle(request: ExecutionRequest): Promise<SessionExecutionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;
    let tempDir: string | null = null;

    try {
      // 1. 임시 파일/디렉토리 생성
      const extension = this.getFileExtension(request.language);

      if (request.language === 'java') {
        // Java는 컴파일을 위해 쓰기 가능한 디렉토리 필요
        tempDir = mkdtempSync(join(tmpdir(), 'synapse-java-'));
        tempFilePath = join(tempDir, 'Main.java');
        writeFileSync(tempFilePath, request.code, 'utf8');
      } else {
        // Python, JavaScript는 단일 파일
        const fileName = `synapse-${Date.now()}`;
        tempFilePath = join(tmpdir(), `${fileName}.${extension}`);
        writeFileSync(tempFilePath, request.code, 'utf8');
      }

      // 2. Docker 명령 생성
      const dockerArgs = this.buildDockerCommand(request, tempFilePath, tempDir);

      console.log(`[Docker] Executing ${request.language} code (block: ${request.blockId})`);

      // 3. 실행
      const result = await this.runDocker(dockerArgs, request.timeout || 5000);

      if (result.exitCode !== 0) {
        console.log(`[Docker] Execution failed (exit code: ${result.exitCode})`);
      }

      // 4. 결과 반환
      const isSuccess = result.exitCode === 0;
      const combinedOutput = result.stdout + (result.stderr ? '\n' + result.stderr : '');

      return {
        blockId: request.blockId,
        output: isSuccess ? result.stdout : combinedOutput,
        error: isSuccess ? null : (result.stderr || combinedOutput || '실행 실패'),
        executionTime: Date.now() - startTime,
        exitCode: result.exitCode,
        status: isSuccess ? 'success' : 'error',
        sessionId: null,
        isSessionActive: false,
      };
    } catch (error: any) {
      console.error(`[Docker] Error executing ${request.language} code:`, error.message);
      return {
        blockId: request.blockId,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: error.message.includes('timeout') ? 'timeout' : 'error',
        sessionId: null,
        isSessionActive: false,
      };
    } finally {
      // 5. 임시 파일/디렉토리 삭제
      if (tempDir) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
      } else if (tempFilePath) {
        try { unlinkSync(tempFilePath); } catch {}
      }
    }
  }

  private buildDockerCommand(request: ExecutionRequest, filePath: string, tempDir: string | null = null): string[] {
    const config = DOCKER_SECURITY_CONFIG[request.language];

    const baseArgs = [
      'run',
      '--rm',
      '--cpus', config.cpus,
      '--memory', config.memory,
      '--memory-swap', config.memorySwap,
      '--pids-limit', config.pidsLimit.toString(),
      '--network', 'none',
      '--security-opt', 'no-new-privileges',
      '--cap-drop', 'ALL',
    ];

    // Java는 디렉토리 전체를 마운트하고 그 안에서 컴파일/실행
    if (request.language === 'java' && tempDir) {
      const normalizedDir = this.normalizePath(tempDir);
      return [
        ...baseArgs,
        '-v', `${normalizedDir}:/workspace`,  // 디렉토리 마운트 (쓰기 가능)
        '-w', '/workspace',  // 작업 디렉토리 설정
        config.image,
        'sh', '-c', 'javac Main.java 2>&1 && java Main 2>&1',
      ];
    } else {
      // Python, JavaScript는 단일 파일
      const normalizedPath = this.normalizePath(filePath);
      const extension = this.getFileExtension(request.language);
      const containerFileName = `main.${extension}`;
      const containerPath = `/code/${containerFileName}`;

      return [
        ...baseArgs,
        '--read-only',
        '--tmpfs', '/tmp:size=64m',
        '-v', `${normalizedPath}:${containerPath}:ro`,
        config.image,
        ...this.getExecutionCommand(request.language, containerPath),
      ];
    }
  }

  private getExecutionCommand(language: Language, filePath: string): string[] {
    switch (language) {
      case 'python':
        return ['python', filePath];
      case 'javascript':
        return ['node', filePath];
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private runDocker(args: string[], timeout: number): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Windows에서는 shell: false로 설정하여 직접 docker 실행
      const child = spawn('docker', args, {
        shell: false,  // shell 사용 안 함
        windowsHide: true,
      });

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
        reject(new Error('실행 시간 초과 (5초)'));
      }, timeout);

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (!timedOut) {
          resolve({ stdout, stderr, exitCode: code ?? -1 });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  private normalizePath(filePath: string): string {
    // Docker Desktop은 모든 플랫폼의 네이티브 경로를 처리 가능
    return filePath;
  }

  private getFileExtension(language: Language): string {
    switch (language) {
      case 'python': return 'py';
      case 'javascript': return 'js';
      case 'java': return 'java';
    }
  }
}
