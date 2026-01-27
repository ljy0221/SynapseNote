import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
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
    image: "openjdk:17-alpine",
    cpus: "1.0",
    memory: "512m",
    memorySwap: "512m",
    pidsLimit: 50,
    timeout: 5e3
  }
};
class DockerExecService {
  async executeSingle(request) {
    const startTime = Date.now();
    let tempFilePath = null;
    try {
      const extension = this.getFileExtension(request.language);
      const fileName = request.language === "java" ? "Main" : `synapse-${Date.now()}`;
      tempFilePath = join(tmpdir(), `${fileName}.${extension}`);
      writeFileSync(tempFilePath, request.code, "utf8");
      const dockerArgs = this.buildDockerCommand(request, tempFilePath);
      const result = await this.runDocker(dockerArgs, request.timeout || 5e3);
      return {
        blockId: request.blockId,
        output: result.stdout,
        error: result.stderr || null,
        executionTime: Date.now() - startTime,
        exitCode: result.exitCode,
        status: result.exitCode === 0 ? "success" : "error"
      };
    } catch (error) {
      return {
        blockId: request.blockId,
        output: "",
        error: error.message,
        executionTime: Date.now() - startTime,
        exitCode: -1,
        status: error.message.includes("timeout") ? "timeout" : "error"
      };
    } finally {
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
        } catch {
        }
      }
    }
  }
  buildDockerCommand(request, filePath) {
    const config = DOCKER_SECURITY_CONFIG[request.language];
    const normalizedPath = this.normalizePath(filePath);
    const extension = this.getFileExtension(request.language);
    const containerFileName = request.language === "java" ? "Main" : "main";
    const containerPath = `/code/${containerFileName}.${extension}`;
    return [
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
      "--read-only",
      "--tmpfs",
      "/tmp:size=64m",
      "--security-opt",
      "no-new-privileges",
      "--cap-drop",
      "ALL",
      "-v",
      `${normalizedPath}:${containerPath}:ro`,
      config.image,
      ...this.getExecutionCommand(request.language, containerPath)
    ];
  }
  getExecutionCommand(language, filePath) {
    switch (language) {
      case "python":
        return ["python", filePath];
      case "javascript":
        return ["node", filePath];
      case "java":
        const dir = filePath.substring(0, filePath.lastIndexOf("/"));
        return ["sh", "-c", `cd ${dir} && javac Main.java && java Main`];
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
        shell: true,
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
    if (process.platform === "win32") {
      return filePath.replace(/\\/g, "/").replace(/^([A-Z]):/, (_, drive) => `/${drive.toLowerCase()}`);
    }
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
ipcMain.handle("docker:check-installed", async () => {
  return await healthService.checkInstalled();
});
ipcMain.handle("docker:check-running", async () => {
  return await healthService.checkRunning();
});
ipcMain.handle("docker:execute-single", async (event, request) => {
  return await execService.executeSingle(request);
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
