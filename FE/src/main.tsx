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

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
