var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { ipcMain, shell, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
import { mkdtempSync, writeFileSync, rmSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
class DockerHealthService {
  async checkInstalled() {
    try {
      const result = await this.executeCommand("docker", ["--version"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
  async checkRunning() {
    try {
      const result = await this.executeCommand("docker", ["ps"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
  executeCommand(cmd, args) {
    return new Promise((resolve) => {
      const child = spawn(cmd, args, { shell: true, windowsHide: true });
      child.on("close", (code) => resolve({ exitCode: code ?? -1 }));
      child.on("error", () => resolve({ exitCode: -1 }));
    });
  }
}
const DOCKER_SECURITY_CONFIG = {
  python: {
    image: "python:3.11-alpine",
    cpus: "1.0",
    memory: "512m",
    memorySwap: "512m",
    pidsLimit: 50,
    timeout: 5e3
  },
  javascript: {
    image: "node:20-alpine",
    cpus: "1.0",
    memory: "512m",
    memorySwap: "512m",
    pidsLimit: 50,
    timeout: 5e3
  },
  java: {
    image: "eclipse-temurin:17-alpine",
    cpus: "1.0",
    memory: "512m",
    memorySwap: "512m",
    pidsLimit: 50,
    timeout: 5e3
  }
};
class SessionManager {
  constructor() {
    __publicField(this, "sessions", /* @__PURE__ */ new Map());
    __publicField(this, "IDLE_TIMEOUT", 30 * 60 * 1e3);
    // 30분
    __publicField(this, "CLEANUP_INTERVAL", 5 * 60 * 1e3);
    // 5분
    __publicField(this, "cleanupTimer");
    this.startCleanupScheduler();
  }
  /**
   * 세션 키 생성 (noteId + language)
   */
  getSessionKey(noteId, language) {
    return `${noteId}:${language}`;
  }
  /**
   * 세션 생성 또는 기존 세션 반환
   */
  async createSession(noteId, language, version) {
    if (language === "java") {
      throw new Error("Session mode not supported for Java");
    }
    const key = this.getSessionKey(noteId, language);
    if (this.sessions.has(key)) {
      const session = this.sessions.get(key);
      if (session.info.status === "terminated") {
        await this.destroySession(noteId, language);
      } else {
        session.info.lastActivityAt = Date.now();
        session.info.status = "active";
        console.log(`[Session] Reusing existing session: ${session.info.sessionId}`);
        return session.info;
      }
    }
    console.log(`[Session] Creating new session for ${language} (note: ${noteId})`);
    const sessionId = randomUUID();
    const containerId = await this.startContainer(language, version);
    const process2 = await this.attachToContainer(containerId, language);
    const sessionInfo = {
      sessionId,
      noteId,
      language,
      version,
      containerId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      status: "active"
    };
    const sessionState = {
      info: sessionInfo,
      process: process2,
      outputBuffer: "",
      isWaitingForOutput: false
    };
    this.setupOutputListener(sessionState);
    this.sessions.set(key, sessionState);
    console.log(`[Session] Created: ${sessionId} (container: ${containerId})`);
    return sessionInfo;
  }
  /**
   * 세션에서 코드 실행
   */
  async executeInSession(noteId, language, code, timeout = 5e3) {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    if (!session) {
      throw new Error("Session not found. Please create a session first.");
    }
    const startTime = Date.now();
    try {
      const endMarker = `__END_${Date.now()}__`;
      const wrappedCode = this.wrapCodeWithMarker(code, language, endMarker);
      const result = await this.sendCodeToREPL(session, wrappedCode, endMarker, timeout);
      session.info.lastActivityAt = Date.now();
      return {
        ...result,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: "",
        error: error.message || "Execution failed",
        executionTime: Date.now() - startTime
      };
    }
  }
  /**
   * 세션 종료
   */
  async destroySession(noteId, language) {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    if (!session) {
      return;
    }
    console.log(`[Session] Destroying session: ${session.info.sessionId}`);
    try {
      session.process.kill();
    } catch {
    }
    try {
      await this.killContainer(session.info.containerId);
    } catch {
    }
    session.info.status = "terminated";
    this.sessions.delete(key);
  }
  /**
   * 세션 상태 조회
   */
  getSessionInfo(noteId, language) {
    const key = this.getSessionKey(noteId, language);
    const session = this.sessions.get(key);
    return session ? session.info : null;
  }
  /**
   * 모든 세션 정리 (앱 종료 시)
   */
  async cleanupAll() {
    console.log("[Session] Cleaning up all sessions");
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    const destroyPromises = Array.from(this.sessions.entries()).map(([key, session]) => {
      const [noteId, language] = key.split(":");
      return this.destroySession(noteId, language);
    });
    await Promise.all(destroyPromises);
  }
  /**
   * 비활성 세션 정리 스케줄러
   */
  startCleanupScheduler() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleSessions();
    }, this.CLEANUP_INTERVAL);
  }
  /**
   * 30분 이상 비활성 세션 정리
   */
  cleanupIdleSessions() {
    const now = Date.now();
    const sessionsToDestroy = [];
    Array.from(this.sessions.entries()).forEach(([key, session]) => {
      const idleTime = now - session.info.lastActivityAt;
      if (idleTime > this.IDLE_TIMEOUT) {
        console.log(`[Session] Idle timeout: ${session.info.sessionId} (idle for ${Math.floor(idleTime / 1e3)}s)`);
        const [noteId, language] = key.split(":");
        sessionsToDestroy.push([noteId, language]);
      }
    });
    sessionsToDestroy.forEach(([noteId, language]) => {
      this.destroySession(noteId, language);
    });
  }
  /**
   * Docker 컨테이너 시작
   */
  async startContainer(language, version) {
    const config = DOCKER_SECURITY_CONFIG[language];
    const args = [
      "run",
      "-d",
      // detached
      "--interactive",
      // stdin 열기
      "--cpus",
      config.cpus,
      "--memory",
      config.memory,
      "--memory-swap",
      config.memorySwap,
      "--pids-limit",
      config.pidsLimit.toString(),
      "--network",
      "none",
      "--security-opt",
      "no-new-privileges",
      "--cap-drop",
      "ALL",
      "--read-only",
      "--tmpfs",
      "/tmp:size=64m",
      config.image,
      language === "python" ? "python" : "node"
      // REPL 모드
    ];
    return new Promise((resolve, reject) => {
      const child = spawn("docker", args, { shell: false, windowsHide: true });
      let containerId = "";
      child.stdout.on("data", (data) => {
        containerId += data.toString().trim();
      });
      child.on("close", (code) => {
        if (code === 0 && containerId) {
          resolve(containerId);
        } else {
          reject(new Error("Failed to start container"));
        }
      });
      child.on("error", reject);
    });
  }
  /**
   * 컨테이너에 연결 (stdin/stdout)
   */
  async attachToContainer(containerId, language) {
    const args = ["attach", "--sig-proxy=false", containerId];
    const child = spawn("docker", args, {
      shell: false,
      windowsHide: true
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    return child;
  }
  /**
   * 출력 리스너 설정
   */
  setupOutputListener(session) {
    var _a, _b;
    (_a = session.process.stdout) == null ? void 0 : _a.on("data", (data) => {
      if (session.isWaitingForOutput) {
        session.outputBuffer += data.toString();
      }
    });
    (_b = session.process.stderr) == null ? void 0 : _b.on("data", (data) => {
      if (session.isWaitingForOutput) {
        session.outputBuffer += data.toString();
      }
    });
    session.process.on("exit", () => {
      session.info.status = "terminated";
      if (session.currentReject) {
        session.currentReject(new Error("Container exited unexpectedly"));
      }
    });
  }
  /**
   * REPL에 코드 전송 및 출력 수집
   */
  sendCodeToREPL(session, wrappedCode, endMarker, timeout) {
    return new Promise((resolve, reject) => {
      session.outputBuffer = "";
      session.isWaitingForOutput = true;
      session.currentResolve = resolve;
      session.currentReject = reject;
      let timeoutId = null;
      let checkInterval = null;
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
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Execution timeout (5s)"));
      }, timeout);
      checkInterval = setInterval(() => {
        if (session.outputBuffer.includes(endMarker)) {
          cleanup();
          const cleanOutput = this.cleanOutput(
            session.outputBuffer,
            endMarker,
            session.info.language
          );
          const hasError = this.detectError(cleanOutput, session.info.language);
          resolve({
            output: cleanOutput,
            error: hasError ? cleanOutput : null
          });
        }
      }, 50);
      if (session.process.stdin) {
        session.process.stdin.write(wrappedCode + "\n");
      } else {
        cleanup();
        reject(new Error("stdin not available"));
      }
    });
  }
  /**
   * 코드에 엔드 마커 추가
   */
  wrapCodeWithMarker(code, language, endMarker) {
    if (language === "python") {
      return `${code}
print("${endMarker}")`;
    } else if (language === "javascript") {
      return `${code}
console.log("${endMarker}")`;
    }
    return code;
  }
  /**
   * 출력 정리 (마커 제거, 프롬프트 제거)
   */
  cleanOutput(output, endMarker, language) {
    let cleaned = output.replace(endMarker, "").trim();
    if (language === "python") {
      cleaned = cleaned.replace(/>>> /g, "").replace(/\.\.\. /g, "");
    }
    if (language === "javascript") {
      cleaned = cleaned.replace(/> /g, "");
    }
    return cleaned.trim();
  }
  /**
   * 에러 감지
   */
  detectError(output, language) {
    if (language === "python") {
      return /Traceback \(most recent call last\):/i.test(output) || /^[A-Z]\w*Error:/m.test(output) || /^\s+File ".*", line \d+/m.test(output);
    } else if (language === "javascript") {
      return /^[A-Z]\w*Error:/m.test(output) || /^\s+at .+ \(.+:\d+:\d+\)/m.test(output);
    }
    return false;
  }
  /**
   * 컨테이너 강제 종료
   */
  async killContainer(containerId) {
    return new Promise((resolve) => {
      const child = spawn("docker", ["kill", containerId], { shell: false, windowsHide: true });
      child.on("close", () => resolve());
      child.on("error", () => resolve());
    });
  }
}
class DockerExecService {
  constructor() {
    __publicField(this, "sessionManager");
    this.sessionManager = new SessionManager();
  }
  /**
   * 통합 실행 메서드 (모드 감지 후 라우팅)
   */
  async execute(request) {
    if (request.mode === "session") {
      return this.executeSession(request);
    }
    return this.executeSingle(request);
  }
  /**
   * 세션 모드 실행
   */
  async executeSession(request) {
    const startTime = Date.now();
    try {
      if (!request.noteId) {
        throw new Error("noteId is required for session mode");
      }
      if (request.language === "java") {
        throw new Error("Session mode not supported for Java");
      }
      const sessionInfo = await this.sessionManager.createSession(
        request.noteId,
        request.language,
        request.version
      );
      const result = await this.sessionManager.executeInSession(
        request.noteId,
        request.language,
        request.code,
        request.timeout || 5e3
      );
      const isSuccess = result.error === null;
      return {
        blockId: request.blockId,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        exitCode: isSuccess ? 0 : 1,
        status: isSuccess ? "success" : "error",
        sessionId: sessionInfo.sessionId,
        isSessionActive: true
      };
    } catch (error) {
      console.error(`[Docker] Session execution failed:`, error.message);
      return {
        blockId: request.blockId,
        output: "",
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: "error",
        isSessionActive: false
      };
    }
  }
  /**
   * 세션 상태 조회
   */
  getSessionStatus(noteId, language) {
    return this.sessionManager.getSessionInfo(noteId, language);
  }
  /**
   * 세션 종료
   */
  async destroySession(noteId, language) {
    return this.sessionManager.destroySession(noteId, language);
  }
  /**
   * 앱 종료 시 정리
   */
  async cleanup() {
    return this.sessionManager.cleanupAll();
  }
  async executeSingle(request) {
    const startTime = Date.now();
    let tempFilePath = null;
    let tempDir = null;
    try {
      const extension = this.getFileExtension(request.language);
      if (request.language === "java") {
        tempDir = mkdtempSync(join(tmpdir(), "synapse-java-"));
        tempFilePath = join(tempDir, "Main.java");
        writeFileSync(tempFilePath, request.code, "utf8");
      } else {
        const fileName = `synapse-${Date.now()}`;
        tempFilePath = join(tmpdir(), `${fileName}.${extension}`);
        writeFileSync(tempFilePath, request.code, "utf8");
      }
      const dockerArgs = this.buildDockerCommand(request, tempFilePath, tempDir);
      console.log(`[Docker] Executing ${request.language} code (block: ${request.blockId})`);
      const result = await this.runDocker(dockerArgs, request.timeout || 5e3);
      if (result.exitCode !== 0) {
        console.log(`[Docker] Execution failed (exit code: ${result.exitCode})`);
      }
      const isSuccess = result.exitCode === 0;
      const combinedOutput = result.stdout + (result.stderr ? "\n" + result.stderr : "");
      return {
        blockId: request.blockId,
        output: isSuccess ? result.stdout : combinedOutput,
        error: isSuccess ? null : result.stderr || combinedOutput || "실행 실패",
        executionTime: Date.now() - startTime,
        exitCode: result.exitCode,
        status: isSuccess ? "success" : "error",
        sessionId: null,
        isSessionActive: false
      };
    } catch (error) {
      console.error(`[Docker] Error executing ${request.language} code:`, error.message);
      return {
        blockId: request.blockId,
        output: "",
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: error.message.includes("timeout") ? "timeout" : "error",
        sessionId: null,
        isSessionActive: false
      };
    } finally {
      if (tempDir) {
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch {
        }
      } else if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
        } catch {
        }
      }
    }
  }
  buildDockerCommand(request, filePath, tempDir = null) {
    const config = DOCKER_SECURITY_CONFIG[request.language];
    const baseArgs = [
      "run",
      "--rm",
      "--cpus",
      config.cpus,
      "--memory",
      config.memory,
      "--memory-swap",
      config.memorySwap,
      "--pids-limit",
      config.pidsLimit.toString(),
      "--network",
      "none",
      "--security-opt",
      "no-new-privileges",
      "--cap-drop",
      "ALL"
    ];
    if (request.language === "java" && tempDir) {
      const normalizedDir = this.normalizePath(tempDir);
      return [
        ...baseArgs,
        "-v",
        `${normalizedDir}:/workspace`,
        // 디렉토리 마운트 (쓰기 가능)
        "-w",
        "/workspace",
        // 작업 디렉토리 설정
        config.image,
        "sh",
        "-c",
        "javac Main.java 2>&1 && java Main 2>&1"
      ];
    } else {
      const normalizedPath = this.normalizePath(filePath);
      const extension = this.getFileExtension(request.language);
      const containerFileName = `main.${extension}`;
      const containerPath = `/code/${containerFileName}`;
      return [
        ...baseArgs,
        "--read-only",
        "--tmpfs",
        "/tmp:size=64m",
        "-v",
        `${normalizedPath}:${containerPath}:ro`,
        config.image,
        ...this.getExecutionCommand(request.language, containerPath)
      ];
    }
  }
  getExecutionCommand(language, filePath) {
    switch (language) {
      case "python":
        return ["python", filePath];
      case "javascript":
        return ["node", filePath];
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
  runDocker(args, timeout) {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const child = spawn("docker", args, {
        shell: false,
        // shell 사용 안 함
        windowsHide: true
      });
      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
        reject(new Error("실행 시간 초과 (5초)"));
      }, timeout);
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      child.on("close", (code) => {
        clearTimeout(timeoutId);
        if (!timedOut) {
          resolve({ stdout, stderr, exitCode: code ?? -1 });
        }
      });
      child.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
  normalizePath(filePath) {
    return filePath;
  }
  getFileExtension(language) {
    switch (language) {
      case "python":
        return "py";
      case "javascript":
        return "js";
      case "java":
        return "java";
    }
  }
}
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    frame: false,
    // 커스텀 헤더 사용을 위해 프레임 제거
    titleBarStyle: "hidden",
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      // 보안 설정 (기본값 확인)
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.on("window-minimize", () => {
  win == null ? void 0 : win.minimize();
});
ipcMain.on("window-maximize", () => {
  if (win == null ? void 0 : win.isMaximized()) {
    win.unmaximize();
  } else {
    win == null ? void 0 : win.maximize();
  }
});
ipcMain.on("window-close", () => {
  win == null ? void 0 : win.close();
});
ipcMain.on("open-external", (_, url) => {
  shell.openExternal(url);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
const healthService = new DockerHealthService();
const execService = new DockerExecService();
app.on("will-quit", async () => {
  console.log("[Main] Cleaning up sessions before quit");
  await execService.cleanup();
});
ipcMain.handle("docker:check-installed", async () => {
  return await healthService.checkInstalled();
});
ipcMain.handle("docker:check-running", async () => {
  return await healthService.checkRunning();
});
ipcMain.handle("docker:execute", async (event, request) => {
  return await execService.execute(request);
});
ipcMain.handle("docker:get-session-status", async (event, noteId, language) => {
  return execService.getSessionStatus(noteId, language);
});
ipcMain.handle("docker:destroy-session", async (event, noteId, language) => {
  return await execService.destroySession(noteId, language);
});
ipcMain.handle("docker:execute-single", async (event, request) => {
  return await execService.executeSingle(request);
});
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("synapse", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("synapse");
}
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const url = commandLine.find((arg) => arg.startsWith("synapse://"));
      if (url) {
        win.webContents.send("deep-link-url", url);
      }
    }
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (win) {
      win.webContents.send("deep-link-url", url);
    }
  });
  app.whenReady().then(createWindow);
}
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
