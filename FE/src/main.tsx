import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './components/common/styles/Theme.css' // 전역 테마 변수 (가장 먼저 로드)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge (Electron 환경에서만)
if (typeof window !== 'undefined' && window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
}

