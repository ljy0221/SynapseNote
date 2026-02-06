import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: any[]) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: any[]) {
    const [channel, listener] = args
    return ipcRenderer.off(channel, listener)
  },
  send(...args: any[]) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: any[]) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// === 이 부분이 추가되어야 버튼이 작동합니다 ===
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  onDeepLinkUrl: (callback: (event: any, url: string) => void) => {
    ipcRenderer.on('deep-link-url', callback);
  },
  removeDeepLinkListener: (callback: (event: any, url: string) => void) => {
    ipcRenderer.removeListener('deep-link-url', callback);
  },
  // [New] 대기 중인 Deep Link 조회 (Pull 방식)
  getDeepLink: () => ipcRenderer.invoke('docker:get-deep-link'),
})

// Docker API 노출
contextBridge.exposeInMainWorld('dockerAPI', {
  checkInstalled: () => ipcRenderer.invoke('docker:check-installed'),
  checkRunning: () => ipcRenderer.invoke('docker:check-running'),

  // NEW: 통합 실행
  execute: (request: any) => ipcRenderer.invoke('docker:execute', request),

  // NEW: 세션 관리
  getSessionStatus: (noteId: string, language: string) =>
    ipcRenderer.invoke('docker:get-session-status', noteId, language),
  destroySession: (noteId: string, language: string) =>
    ipcRenderer.invoke('docker:destroy-session', noteId, language),

  // 기존 호환성 유지
  executeSingle: (request: any) => ipcRenderer.invoke('docker:execute-single', request),
})