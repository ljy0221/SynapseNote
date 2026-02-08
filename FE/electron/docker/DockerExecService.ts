import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ExecutionRequest, Language, SessionExecutionResult, SessionInfo } from '../../src/types/execution/ExecutionTypes';
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
    console.log(`[Docker LOG] Execute started - Mode: ${request.mode}, Lang: ${request.language}`); // 진입 로그 추가
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
    console.log(`[Docker LOG] Session execution triggered for note: ${request.noteId}`);

    try {
      if (!request.noteId) throw new Error('noteId is required for session mode');
      if (request.language === 'java') throw new Error('Session mode not supported for Java');

      // 0. 이미지 확인 (없으면 다운로드 대기)
      await this.ensureImage(request.language);

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
        request.timeout || 10000
      );

      const isSuccess = result.error === null;
      console.log(`[Docker LOG] Session execution completed. Success: ${isSuccess}`);

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
      console.error(`[Docker LOG] Session execution failed:`, error.message);
      return {
        blockId: request.blockId,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: 'error',
        sessionId: null,
        isSessionActive: false,
      };
    }
  }

  getSessionStatus(noteId: string, language: Language): SessionInfo | null {
    return this.sessionManager.getSessionInfo(noteId, language);
  }

  async destroySession(noteId: string, language: Language): Promise<void> {
    return this.sessionManager.destroySession(noteId, language);
  }

  async cleanup(): Promise<void> {
    return this.sessionManager.cleanupAll();
  }

  async executeSingle(request: ExecutionRequest): Promise<SessionExecutionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;
    let tempDir: string | null = null;

    try {
      const extension = this.getFileExtension(request.language);
      if (request.language === 'java') {
        tempDir = mkdtempSync(join(tmpdir(), 'synapse-java-'));
        tempFilePath = join(tempDir, 'Main.java');
        writeFileSync(tempFilePath, request.code, 'utf8');
      } else {
        const fileName = `synapse-${Date.now()}`;
        tempFilePath = join(tmpdir(), `${fileName}.${extension}`);
        writeFileSync(tempFilePath, request.code, 'utf8');
      }

      // 이미지 확인 (없으면 다운로드 대기)
      await this.ensureImage(request.language);

      const dockerArgs = this.buildDockerCommand(request, tempFilePath, tempDir);
      const result = await this.runDocker(dockerArgs, request.timeout || 10000);

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
      if (tempDir) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch { }
      } else if (tempFilePath) {
        try { unlinkSync(tempFilePath); } catch { }
      }
    }
  }

  private buildDockerCommand(request: ExecutionRequest, filePath: string, tempDir: string | null = null): string[] {
    const config = DOCKER_SECURITY_CONFIG[request.language];
    const baseArgs = [
      'run', '--rm', '--cpus', config.cpus, '--memory', config.memory,
      '--network', 'none', '--security-opt', 'no-new-privileges',
    ];

    if (request.language === 'java' && tempDir) {
      return [...baseArgs, '-v', `${tempDir}:/workspace`, '-w', '/workspace', config.image, 'sh', '-c', 'javac Main.java 2>&1 && java Main 2>&1'];
    } else {
      const extension = this.getFileExtension(request.language);
      const containerPath = `/code/main.${extension}`;
      return [...baseArgs, '--read-only', '--tmpfs', '/tmp:size=64m', '-v', `${filePath}:${containerPath}:ro`, config.image, ...this.getExecutionCommand(request.language, containerPath)];
    }
  }

  private getExecutionCommand(language: Language, filePath: string): string[] {
    return language === 'python' ? ['python', filePath] : ['node', filePath];
  }

  private runDocker(args: string[], timeout: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      let stdout = ''; let stderr = ''; let timedOut = false;
      const child = spawn('docker', args, { shell: false, windowsHide: true });
      const timeoutId = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); reject(new Error(`실행 시간 초과`)); }, timeout);
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });
      child.on('close', (code) => { clearTimeout(timeoutId); if (!timedOut) resolve({ stdout, stderr, exitCode: code ?? -1 }); });
      child.on('error', (error) => { clearTimeout(timeoutId); reject(error); });
    });
  }

  private getFileExtension(language: Language): string {
    if (language === 'python') return 'py';
    if (language === 'javascript') return 'js';
    return 'java';
  }

  /**
   * 이미지 존재 여부 확인 및 다운로드 (타임아웃 방지)
   */
  async ensureImage(language: Language): Promise<void> {
    const config = DOCKER_SECURITY_CONFIG[language];
    const image = config.image;

    try {
      // 1. 이미지 존재 확인
      const inspectResult = await this.runDocker(['image', 'inspect', image], 5000);
      if (inspectResult.exitCode !== 0) {
        throw new Error('Image not found');
      }
      console.log(`[Docker LOG] Image already exists: ${image}`); // [New] 확인 로그 추가
    } catch {
      console.log(`[Docker LOG] Image not found: ${image}. Pulling...`);
      try {
        // 2. 이미지 다운로드 (10분 타임아웃)
        const pullResult = await this.runDocker(['pull', image], 600000);
        if (pullResult.exitCode !== 0) {
          throw new Error(`Pull failed with code ${pullResult.exitCode}: ${pullResult.stderr}`);
        }
        console.log(`[Docker LOG] Image pulled successfully: ${image}`);
      } catch (error: any) {
        console.error(`[Docker LOG] Failed to pull image ${image}:`, error.message);
        throw new Error(`Docker image download failed: ${image}`); // 실행 중단
      }
    }
  }

  /**
   * 모든 지원 언어의 이미지를 백그라운드에서 확인/다운로드
   */
  async ensureAllImages(): Promise<void> {
    const languages: Language[] = ['python', 'javascript', 'java'];
    console.log('[Docker LOG] Starting background image check...');

    // 병렬로 진행하되, 실패해도 앱 실행에는 지장 없도록 개별 catch
    languages.forEach(lang => {
      this.ensureImage(lang).catch(err => {
        console.error(`[Docker LOG] Background pull failed for ${lang}:`, err.message);
      });
    });
  }
}