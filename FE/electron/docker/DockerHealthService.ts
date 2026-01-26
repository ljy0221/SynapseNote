import { spawn } from 'child_process';

export class DockerHealthService {
  async checkInstalled(): Promise<boolean> {
    try {
      const result = await this.executeCommand('docker', ['--version']);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async checkRunning(): Promise<boolean> {
    try {
      const result = await this.executeCommand('docker', ['ps']);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  private executeCommand(cmd: string, args: string[]): Promise<{exitCode: number}> {
    return new Promise((resolve) => {
      const child = spawn(cmd, args, { shell: true, windowsHide: true });
      child.on('close', (code) => resolve({ exitCode: code ?? -1 }));
      child.on('error', () => resolve({ exitCode: -1 }));
    });
  }
}
