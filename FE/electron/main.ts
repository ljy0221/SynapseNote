import { app, BrowserWindow, ipcMain } from 'electron' // ipcMain 추가
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DockerHealthService } from './docker/DockerHealthService'
import { DockerExecService } from './docker/DockerExecService'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    frame: false, // 커스텀 헤더 사용을 위해 프레임 제거
    titleBarStyle: 'hidden',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // 보안 설정 (기본값 확인)
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ==========================================
// [중요] 창 제어 이벤트 리스너 (반드시 추가되어야 함)
// ==========================================
ipcMain.on('window-minimize', () => {
  win?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window-close', () => {
  win?.close();
});
// ==========================================

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Docker 서비스 초기화
const healthService = new DockerHealthService();
const execService = new DockerExecService();

// 앱 종료 시 정리
app.on('will-quit', async () => {
  console.log('[Main] Cleaning up sessions before quit');
  await execService.cleanup();
});

// Docker IPC 핸들러
ipcMain.handle('docker:check-installed', async () => {
  return await healthService.checkInstalled();
});

ipcMain.handle('docker:check-running', async () => {
  return await healthService.checkRunning();
});

// NEW: 통합 실행 핸들러
ipcMain.handle('docker:execute', async (event, request) => {
  return await execService.execute(request);
});

// NEW: 세션 상태 조회
ipcMain.handle('docker:get-session-status', async (event, noteId, language) => {
  return execService.getSessionStatus(noteId, language);
});

// NEW: 세션 종료
ipcMain.handle('docker:destroy-session', async (event, noteId, language) => {
  return await execService.destroySession(noteId, language);
});

// 기존 호환성 유지
ipcMain.handle('docker:execute-single', async (event, request) => {
  return await execService.executeSingle(request);
});

app.whenReady().then(createWindow)