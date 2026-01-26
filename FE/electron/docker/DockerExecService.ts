import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ExecutionRequest, ExecutionResult, Language } from '../../src/types/execution/ExecutionTypes';
import { DOCKER_SECURITY_CONFIG } from './SecurityConfig';

export class DockerExecService {
  async executeSingle(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;

    try {
      // 1. 임시 파일 생성
      const extension = this.getFileExtension(request.language);
      const fileName = request.language === 'java' ? 'Main' : `synapse-${Date.now()}`;
      tempFilePath = join(tmpdir(), `${fileName}.${extension}`);
      writeFileSync(tempFilePath, request.code, 'utf8');

      // 2. Docker 명령 생성
      const dockerArgs = this.buildDockerCommand(request, tempFilePath);

      // 3. 실행
      const result = await this.runDocker(dockerArgs, request.timeout || 5000);

      // 4. 결과 반환
      return {
        blockId: request.blockId,
        output: result.stdout,
        error: result.stderr || null,
        executionTime: Date.now() - startTime,
        exitCode: result.exitCode,
        status: result.exitCode === 0 ? 'success' : 'error',
      };
    } catch (error: any) {
      return {
        blockId: request.blockId,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: error.message.includes('timeout') ? 'timeout' : 'error',
      };
    } finally {
      // 5. 임시 파일 삭제
      if (tempFilePath) {
        try { unlinkSync(tempFilePath); } catch {}
      }
    }
  }

  private buildDockerCommand(request: ExecutionRequest, filePath: string): string[] {
    const config = DOCKER_SECURITY_CONFIG[request.language];
    const normalizedPath = this.normalizePath(filePath);
    const extension = this.getFileExtension(request.language);

    // Java의 경우 파일명을 Main.java로 고정
    const containerFileName = request.language === 'java' ? 'Main' : 'main';
    const containerPath = `/code/${containerFileName}.${extension}`;

    return [
      'run',
      '--rm',
      '--cpus', config.cpus,
      '--memory', config.memory,
      '--memory-swap', config.memorySwap,
      '--pids-limit', config.pidsLimit.toString(),
      '--network', 'none',
      '--read-only',
      '--tmpfs', '/tmp:size=64m',
      '--security-opt', 'no-new-privileges',
      '--cap-drop', 'ALL',
      '-v', `${normalizedPath}:${containerPath}:ro`,
      config.image,
      ...this.getExecutionCommand(request.language, containerPath),
    ];
  }

  private getExecutionCommand(language: Language, filePath: string): string[] {
    switch (language) {
      case 'python':
        return ['python', filePath];
      case 'javascript':
        return ['node', filePath];
      case 'java':
        // Java는 컴파일 후 실행
        const dir = filePath.substring(0, filePath.lastIndexOf('/'));
        return ['sh', '-c', `cd ${dir} && javac Main.java && java Main`];
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

      const child = spawn('docker', args, {
        shell: true,
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
    if (process.platform === 'win32') {
      // Windows: C:\Users\... -> /c/Users/...
      return filePath
        .replace(/\\/g, '/')
        .replace(/^([A-Z]):/, (_, drive) => `/${drive.toLowerCase()}`);
    }
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
