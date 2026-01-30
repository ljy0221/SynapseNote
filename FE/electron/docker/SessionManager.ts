import { spawn, ChildProcess } from 'child_process';
import type { Language, SessionInfo } from '../../src/types/execution/ExecutionTypes';
import { DOCKER_SECURITY_CONFIG } from './SecurityConfig';
import { randomUUID } from 'crypto';

interface SessionState {
  info: SessionInfo;
  process: ChildProcess;
  outputBuffer: string;
  isWaitingForOutput: boolean;
  currentResolve?: (result: { output: string; error: string | null }) => void;
  currentReject?: (error: Error) => void;
}

export class SessionManager {
  private sessions: Map<string, SessionState> = new Map();
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30분
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * 세션 키 생성 (noteId + language)
   */
  private getSessionKey(noteId: string, language: Language): string {
    return `${noteId}:${language}`;
  }

  /**
   * 세션 생성 또는 기존 세션 반환
   */
  async createSession(noteId: string, language: Language, version: string): Promise<SessionInfo> {
    // Java는 세션 모드 미지원
    if (language === 'java') {
      throw new Error('Session mode not supported for Java');
    }

    const key = this.getSessionKey(noteId, language);

    // 기존 세션 재사용
    if (this.sessions.has(key)) {
      const session = this.sessions.get(key)!;

      // 세션이 종료되었으면 재생성
      if (session.info.status === 'terminated') {
        await this.destroySession(noteId, language);
      } else {
        session.info.lastActivityAt = Date.now();
        session.info.status = 'active';
        console.log(`[Session] Reusing existing session: ${session.info.sessionId}`);
        return session.info;
      }
    }

    // 새 세션 생성
    console.log(`[Session] Creating new session for ${language} (note: ${noteId})`);

    const sessionId = randomUUID();
    const containerId = await this.startContainer(language, version);
    const process = await this.attachToContainer(containerId, language);

    const sessionInfo: SessionInfo = {
      sessionId,
      noteId,
      language,
      version,
      containerId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      status: 'active',
    };

    const sessionState: SessionState = {
      info: sessionInfo,
      process,
      outputBuffer: '',
      isWaitingForOutput: false,
    };

    // stdout 리스너 설정
    this.setupOutputListener(sessionState);

    this.sessions.set(key, sessionState);

    console.log(`[Session] Created: ${sessionId} (container: ${containerId})`);

    return sessionInfo;
  }

  /**
   * 세션에서 코드 실행
   */
  async executeInSession(
    noteId: string,
    language: Language,
    code: string,
    timeout: number = 5000
  ): Promise<{ output: string; error: string | null; executionTime: number }> {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);

    if (!session) {
      throw new Error('Session not found. Please create a session first.');
    }

    const startTime = Date.now();

    try {
      // 엔드 마커 생성
      const endMarker = `__END_${Date.now()}__`;
      const wrappedCode = this.wrapCodeWithMarker(code, language, endMarker);

      // 실행
      const result = await this.sendCodeToREPL(session, wrappedCode, endMarker, timeout);

      // lastActivityAt 업데이트
      session.info.lastActivityAt = Date.now();

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        output: '',
        error: error.message || 'Execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 세션 종료
   */
  async destroySession(noteId: string, language: Language): Promise<void> {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);

    if (!session) {
      return;
    }

    console.log(`[Session] Destroying session: ${session.info.sessionId}`);

    // 프로세스 종료
    try {
      session.process.kill();
    } catch {}

    // 컨테이너 종료
    try {
      await this.killContainer(session.info.containerId);
    } catch {}

    session.info.status = 'terminated';
    this.sessions.delete(key);
  }

  /**
   * 세션 상태 조회
   */
  getSessionInfo(noteId: string, language: Language): SessionInfo | null {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    return session ? session.info : null;
  }

  /**
   * 모든 세션 정리 (앱 종료 시)
   */
  async cleanupAll(): Promise<void> {
    console.log('[Session] Cleaning up all sessions');

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const destroyPromises = Array.from(this.sessions.entries()).map(([key, session]) => {
      const [noteId, language] = key.split(':');
      return this.destroySession(noteId, language as Language);
    });

    await Promise.all(destroyPromises);
  }

  /**
   * 비활성 세션 정리 스케줄러
   */
  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleSessions();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 30분 이상 비활성 세션 정리
   */
  private cleanupIdleSessions(): void {
    const now = Date.now();
    const sessionsToDestroy: Array<[string, Language]> = [];

    // Array.from으로 변환하여 반복
    Array.from(this.sessions.entries()).forEach(([key, session]) => {
      const idleTime = now - session.info.lastActivityAt;

      if (idleTime > this.IDLE_TIMEOUT) {
        console.log(`[Session] Idle timeout: ${session.info.sessionId} (idle for ${Math.floor(idleTime / 1000)}s)`);
        const [noteId, language] = key.split(':');
        sessionsToDestroy.push([noteId, language as Language]);
      }
    });

    // 비동기 정리
    sessionsToDestroy.forEach(([noteId, language]) => {
      this.destroySession(noteId, language);
    });
  }

  /**
   * Docker 컨테이너 시작
   */
  private async startContainer(language: Language, version: string): Promise<string> {
    const config = DOCKER_SECURITY_CONFIG[language];

    const args = [
      'run',
      '-d', // detached
      '--interactive', // stdin 열기
      '--cpus', config.cpus,
      '--memory', config.memory,
      '--memory-swap', config.memorySwap,
      '--pids-limit', config.pidsLimit.toString(),
      '--network', 'none',
      '--security-opt', 'no-new-privileges',
      '--cap-drop', 'ALL',
      '--read-only',
      '--tmpfs', '/tmp:size=64m',
      config.image,
      language === 'python' ? 'python' : 'node', // REPL 모드
    ];

    return new Promise((resolve, reject) => {
      const child = spawn('docker', args, { shell: false, windowsHide: true });

      let containerId = '';

      child.stdout.on('data', (data) => {
        containerId += data.toString().trim();
      });

      child.on('close', (code) => {
        if (code === 0 && containerId) {
          resolve(containerId);
        } else {
          reject(new Error('Failed to start container'));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * 컨테이너에 연결 (stdin/stdout)
   */
  private async attachToContainer(containerId: string, language: Language): Promise<ChildProcess> {
    const args = ['attach', '--sig-proxy=false', containerId];

    const child = spawn('docker', args, {
      shell: false,
      windowsHide: true,
    });

    // REPL 준비 대기 (간단한 지연)
    await new Promise(resolve => setTimeout(resolve, 500));

    return child;
  }

  /**
   * 출력 리스너 설정
   */
  private setupOutputListener(session: SessionState): void {
    session.process.stdout?.on('data', (data) => {
      if (session.isWaitingForOutput) {
        session.outputBuffer += data.toString();
      }
    });

    session.process.stderr?.on('data', (data) => {
      if (session.isWaitingForOutput) {
        session.outputBuffer += data.toString();
      }
    });

    session.process.on('exit', () => {
      session.info.status = 'terminated';
      if (session.currentReject) {
        session.currentReject(new Error('Container exited unexpectedly'));
      }
    });
  }

  /**
   * REPL에 코드 전송 및 출력 수집
   */
  private sendCodeToREPL(
    session: SessionState,
    wrappedCode: string,
    endMarker: string,
    timeout: number
  ): Promise<{ output: string; error: string | null }> {
    return new Promise((resolve, reject) => {
      session.outputBuffer = '';
      session.isWaitingForOutput = true;
      session.currentResolve = resolve;
      session.currentReject = reject;

      let timeoutId: NodeJS.Timeout | null = null;
      let checkInterval: NodeJS.Timeout | null = null;

      // 타이머 정리 헬퍼 함수
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        session.isWaitingForOutput = false;
      };

      // 타임아웃 설정
      timeoutId = setTimeout(() => {
        cleanup();  // 모든 타이머 정리
        reject(new Error('Execution timeout (5s)'));
      }, timeout);

      // 출력 모니터링
      checkInterval = setInterval(() => {
        if (session.outputBuffer.includes(endMarker)) {
          cleanup();  // 모든 타이머 정리

          const cleanOutput = this.cleanOutput(
            session.outputBuffer,
            endMarker,
            session.info.language
          );
          const hasError = this.detectError(cleanOutput, session.info.language);

          resolve({
            output: cleanOutput,
            error: hasError ? cleanOutput : null,
          });
        }
      }, 50);

      // 코드 전송
      if (session.process.stdin) {
        session.process.stdin.write(wrappedCode + '\n');
      } else {
        cleanup();  // 모든 타이머 정리
        reject(new Error('stdin not available'));
      }
    });
  }

  /**
   * 코드에 엔드 마커 추가
   */
  private wrapCodeWithMarker(code: string, language: Language, endMarker: string): string {
    if (language === 'python') {
      return `${code}\nprint("${endMarker}")`;
    } else if (language === 'javascript') {
      return `${code}\nconsole.log("${endMarker}")`;
    }
    return code;
  }

  /**
   * 출력 정리 (마커 제거, 프롬프트 제거)
   */
  private cleanOutput(output: string, endMarker: string, language: Language): string {
    // 마커 제거
    let cleaned = output.replace(endMarker, '').trim();

    // Python 프롬프트 제거
    if (language === 'python') {
      cleaned = cleaned.replace(/>>> /g, '').replace(/\.\.\. /g, '');
    }

    // Node 프롬프트 제거
    if (language === 'javascript') {
      cleaned = cleaned.replace(/> /g, '');
    }

    return cleaned.trim();
  }

  /**
   * 에러 감지
   */
  private detectError(output: string, language: Language): boolean {
    if (language === 'python') {
      // Python 에러 패턴: Traceback, XXXError:, 스택 트레이스
      return /Traceback \(most recent call last\):/i.test(output) ||
             /^[A-Z]\w*Error:/m.test(output) ||
             /^\s+File ".*", line \d+/m.test(output);
    } else if (language === 'javascript') {
      // JavaScript 에러 패턴: XXXError:, at 함수명 (파일:줄:열)
      return /^[A-Z]\w*Error:/m.test(output) ||
             /^\s+at .+ \(.+:\d+:\d+\)/m.test(output);
    }
    return false;
  }

  /**
   * 컨테이너 강제 종료
   */
  private async killContainer(containerId: string): Promise<void> {
    return new Promise((resolve) => {
      const child = spawn('docker', ['kill', containerId], { shell: false, windowsHide: true });
      child.on('close', () => resolve());
      child.on('error', () => resolve()); // 에러 무시
    });
  }
}
