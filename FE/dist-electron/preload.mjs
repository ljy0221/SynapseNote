"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close"),
  openExternal: (url) => electron.ipcRenderer.send("open-external", url)
});
electron.contextBridge.exposeInMainWorld("dockerAPI", {
  checkInstalled: () => electron.ipcRenderer.invoke("docker:check-installed"),
  checkRunning: () => electron.ipcRenderer.invoke("docker:check-running"),
  // NEW: 통합 실행
  execute: (request) => electron.ipcRenderer.invoke("docker:execute", request),
  // NEW: 세션 관리
  getSessionStatus: (noteId, language) => electron.ipcRenderer.invoke("docker:get-session-status", noteId, language),
  destroySession: (noteId, language) => electron.ipcRenderer.invoke("docker:destroy-session", noteId, language),
  // 기존 호환성 유지
  executeSingle: (request) => electron.ipcRenderer.invoke("docker:execute-single", request)
});
