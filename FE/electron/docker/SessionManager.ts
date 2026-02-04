import { spawn, ChildProcess } from 'child_process';
import type { Language, SessionInfo } from '../../src/types/execution/ExecutionTypes';
import { DOCKER_SECURITY_CONFIG } from './SecurityConfig';
import { randomUUID } from 'crypto';

interface SessionState {
  info: SessionInfo;
  process: ChildProcess;
  outputBuffer: string;
  isWaitingForOutput: boolean;
  // 다중 블록 실행 시 순서를 보장하기 위한 큐
  executionQueue: Array<{
    code: string;
    endMarker: string;
    timeout: number;
    resolve: (result: { output: string; error: string | null }) => void;
    reject: (error: Error) => void;
  }>;
}

export class SessionManager {
  private sessions: Map<string, SessionState> = new Map();
  // 세션 중복 생성 방지를 위한 생성 중인 Promise 맵
  private creatingSessions: Map<string, Promise<SessionInfo>> = new Map();
  
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupScheduler();
  }

  private getSessionKey(noteId: string, language: Language): string {
    return `${noteId}:${language}`;
  }

  public getSessionInfo(noteId: string, language: Language): SessionInfo | null {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    return session ? session.info : null;
  }

  /**
   * 세션 생성 (세션 ID 중복 방지 로직 포함)
   */
  async createSession(noteId: string, language: Language, version: string): Promise<SessionInfo> {
    if (language === 'java') throw new Error('Session mode not supported for Java');
    const key = this.getSessionKey(noteId, language);

    // 1. 이미 활성화된 세션이 있다면 반환
    const existing = this.sessions.get(key);
    if (existing && existing.info.status !== 'terminated') {
      return existing.info;
    }

    // 2. 이미 해당 세션이 생성 중이라면 그 Promise를 반환 (세션 ID 일관성 보장)
    if (this.creatingSessions.has(key)) {
      return this.creatingSessions.get(key)!;
    }

    // 3. 새 세션 생성 시작
    const createPromise = (async () => {
      try {
        const sessionId = randomUUID();
        console.log(`[Session LOG] Creating session ${sessionId} for ${key}`);
        
        const containerId = await this.startContainer(language, version);
        const process = await this.attachToContainer(containerId, language);

        const sessionInfo: SessionInfo = {
          sessionId, noteId, language, version, containerId,
          createdAt: Date.now(), lastActivityAt: Date.now(), status: 'active'
        };

        const sessionState: SessionState = {
          info: sessionInfo,
          process,
          outputBuffer: '',
          isWaitingForOutput: false,
          executionQueue: []
        };

        this.setupOutputListener(sessionState);
        this.sessions.set(key, sessionState);
        
        return sessionInfo;
      } finally {
        this.creatingSessions.delete(key);
      }
    })();

    this.creatingSessions.set(key, createPromise);
    return createPromise;
  }

  /**
   * 세션 내 실행 (큐를 통한 순차 실행)
   */
  async executeInSession(
    noteId: string,
    language: Language,
    code: string,
    timeout: number = 5000
  ): Promise<{ output: string; error: string | null; executionTime: number }> {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    if (!session) throw new Error('Session not found');

    const startTime = Date.now();
    const endMarker = `__END_${Date.now()}_${Math.floor(Math.random() * 1000)}__`;

    return new Promise((resolve, reject) => {
      session.executionQueue.push({
        code: this.wrapCodeWithMarker(code, language, endMarker),
        endMarker,
        timeout,
        resolve: (res) => resolve({ ...res, executionTime: Date.now() - startTime }),
        reject
      });

      if (!session.isWaitingForOutput) {
        this.processQueue(session);
      }
    });
  }

  private async processQueue(session: SessionState) {
    if (session.executionQueue.length === 0) return;

    const task = session.executionQueue[0];
    session.isWaitingForOutput = true;
    session.outputBuffer = '';

    console.log(`[Session LOG] Processing queue. Marker: ${task.endMarker}`);

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      session.isWaitingForOutput = false;
      session.executionQueue.shift();
      task.reject(new Error(`Execution timeout`));
      this.processQueue(session);
    }, task.timeout);

    const checkInterval = setInterval(() => {
      // 버퍼 전체에서 마커를 찾아 프롬프트(> ) 간섭 무시
      if (session.outputBuffer.includes(task.endMarker)) {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        
        const rawOutput = session.outputBuffer;
        session.isWaitingForOutput = false;
        session.executionQueue.shift();

        const cleanOutput = this.cleanOutput(rawOutput, task.endMarker, session.info.language);
        task.resolve({
          output: cleanOutput,
          error: this.detectError(cleanOutput, session.info.language) ? cleanOutput : null
        });

        this.processQueue(session);
      }
    }, 50);

    if (session.process.stdin) {
      session.process.stdin.write(task.code + '\n');
    }
  }

  private wrapCodeWithMarker(code: string, language: Language, endMarker: string): string {
    // IIFE 래핑을 제거하여 블록 간 변수 공유 허용
    if (language === 'javascript') {
      return `${code}\nconsole.log("\\n${endMarker}\\n");`;
    }
    return `${code}\nprint("${endMarker}")`;
  }

  private async startContainer(language: Language, version: string): Promise<string> {
    const config = DOCKER_SECURITY_CONFIG[language];
    const args = [
      'run', '-d', '-i',
      '--cpus', config.cpus, '--memory', config.memory,
      '--network', 'none', '--security-opt', 'no-new-privileges',
      '--tmpfs', '/tmp:size=64m', '--tmpfs', '/root:size=16m',
      config.image, 
      // -i 옵션으로 REPL 강제 실행
      language === 'python' ? 'python' : 'node',
      ...(language === 'javascript' ? ['-i'] : ['-i', '-u'])
    ];
    return new Promise((resolve, reject) => {
      const child = spawn('docker', args, { shell: false, windowsHide: true });
      let containerId = '';
      child.stdout.on('data', (data) => containerId += data.toString().trim());
      child.on('close', (code) => code === 0 && containerId ? resolve(containerId) : reject(new Error('Start failed')));
    });
  }

  private async attachToContainer(containerId: string, language: Language): Promise<ChildProcess> {
    const child = spawn('docker', ['attach', '--sig-proxy=false', containerId], {
      shell: false, windowsHide: true
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return child;
  }

  private setupOutputListener(session: SessionState): void {
    session.process.stdout?.on('data', (data) => {
      const chunk = data.toString();
      console.log(`[Session LOG] stdout: ${chunk}`); // 스트림 확인용 로그
      if (session.isWaitingForOutput) session.outputBuffer += chunk;
    });
    session.process.stderr?.on('data', (data) => {
      if (session.isWaitingForOutput) session.outputBuffer += data.toString();
    });
    session.process.on('exit', () => session.info.status = 'terminated');
  }

  private cleanOutput(output: string, endMarker: string, language: Language): string {
    let cleaned = output.split(endMarker)[0] || '';
    if (language === 'python') {
      cleaned = cleaned.replace(/>>> /g, '').replace(/\.\.\. /g, '');
    } else if (language === 'javascript') {
      cleaned = cleaned.replace(/> /g, '').replace(/undefined\n/g, '');
    }
    return cleaned.trim();
  }

  private detectError(output: string, language: Language): boolean {
    return language === 'python' 
      ? /Traceback/i.test(output) || /Error:/m.test(output)
      : /Error:/m.test(output) || /at .+:\d+:\d+/.test(output);
  }

  async destroySession(noteId: string, language: Language): Promise<void> {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    if (session) {
      session.process.kill();
      spawn('docker', ['kill', session.info.containerId]);
      this.sessions.delete(key);
    }
  }

  async cleanupAll(): Promise<void> {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    for (const [key] of this.sessions) {
      const [noteId, language] = key.split(':');
      await this.destroySession(noteId, language as Language);
    }
  }

  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      this.sessions.forEach((session, key) => {
        if (now - session.info.lastActivityAt > this.IDLE_TIMEOUT) {
          const [noteId, language] = key.split(':');
          this.destroySession(noteId, language as Language);
        }
      });
    }, this.CLEANUP_INTERVAL);
  }
}