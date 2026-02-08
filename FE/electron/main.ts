import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DockerHealthService } from './docker/DockerHealthService'
import { DockerExecService } from './docker/DockerExecService'

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
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !VITE_DEV_SERVER_URL, // Disable web security in dev mode to bypass CORS
    },
  })

  // Origin 헤더 강제 변조 (백엔드 CORS 403 에러 방지)
  // Dev 모드에서도 localhost:5173에서 오는 요청의 Origin을 변조
  win.webContents.session.webRequest.onBeforeSendHeaders(
    {
      urls: [
        'https://i14b102.p.ssafy.io/*',
        'http://i14b102.p.ssafy.io/*',
        'wss://i14b102.p.ssafy.io/*',
        'ws://i14b102.p.ssafy.io/*'
      ]
    },
    (details, callback) => {
      console.log('[Electron] Intercepting request to:', details.url);
      console.log('[Electron] Original Origin:', details.requestHeaders['Origin']);
      details.requestHeaders['Origin'] = 'https://i14b102.p.ssafy.io';
      console.log('[Electron] Modified Origin:', details.requestHeaders['Origin']);
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Handle external links (target="_blank") to open in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // 윈도우 닫힘 시 참조 제거
  win.on('closed', () => {
    win = null;
  });
}

// ==========================================
// 창 제어 이벤트 리스너
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

// 외부 브라우저 열기
ipcMain.on('open-external', (_, url: string) => {
  shell.openExternal(url);
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

// 통합 실행 핸들러
ipcMain.handle('docker:execute', async (_event, request) => {
  return await execService.execute(request);
});

// 세션 상태 조회
ipcMain.handle('docker:get-session-status', async (_event, noteId, language) => {
  return execService.getSessionStatus(noteId, language);
});

// 세션 종료
ipcMain.handle('docker:destroy-session', async (_event, noteId, language) => {
  return await execService.destroySession(noteId, language);
});

ipcMain.handle('docker:execute-single', async (_event, request) => {
  return await execService.executeSingle(request);
});

// Deep Link 설정
let pendingDeepLinkUrl: string | null = null; // 대기 중인 딥링크 URL

// 딥링크 조회 핸들러 (렌더러가 준비된 후 호출)
ipcMain.handle('docker:get-deep-link', () => {
  const url = pendingDeepLinkUrl;
  pendingDeepLinkUrl = null; // 한 번 조회하면 초기화
  return url;
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('synapse', process.execPath, [path.resolve(process.argv[1])])
  } else {
    // argv[1]이 없는 경우 명시적으로 경로 지정 (Dev 모드 fallback)
    app.setAsDefaultProtocolClient('synapse', process.execPath, [path.resolve(process.env.APP_ROOT, 'dist-electron/main.js')])
  }
} else {
  app.setAsDefaultProtocolClient('synapse')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // 윈도우가 없으면 새로 생성 (타이밍 이슈가 있을 수 있음)
    if (!win) {
      createWindow();
    }

    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()

      // Deep Link URL 찾기 (Windows/Linux)
      const url = commandLine.find((arg) => arg.startsWith('synapse://'));
      if (url) {
        pendingDeepLinkUrl = url; // URL 저장
        // 윈도우가 로드된 상태라면 바로 전송 (Push)
        if (!win.webContents.isLoading()) {
          win.webContents.send('deep-link-url', url);
        }
      }
    }
  })

  // macOS용 open-url 이벤트
  app.on('open-url', (event, url) => {
    event.preventDefault();

    // 윈도우가 없으면 생성
    if (!win) {
      createWindow();
    }

    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();

      pendingDeepLinkUrl = url; // URL 저장
      // 윈도우가 로드된 상태라면 바로 전송 (Push)
      if (!win.webContents.isLoading()) {
        win.webContents.send('deep-link-url', url);
      }
    }
  });

  app.whenReady().then(createWindow)
}