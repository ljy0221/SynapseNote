import { useState } from 'react';
import { Header } from './components/layout/header/Header';
import './App.css';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { NoteToolBar } from './components/layout/noteToolbar/NoteToolbar';

function App() {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isToolbarActive] = useState(true);
  return (
    <div className="app-container">
      {/* Layout Layer의 헤더 적용 */}
      <Header
        isSidebarActive={isSidebarActive}
        onToggleSidebar={() =>setIsSidebarActive(prev => !prev)}
      />
      {/* 사이드바 */}
      <Sidebar isOpen={isSidebarActive}>
        <h3>Sidebar</h3>
      </Sidebar>

      {/* 노트 툴바 */}
      <NoteToolBar isOpen={isToolbarActive}>
        <div className="toolbar-header">
          <h4>Note Tool</h4>
        </div>
      </NoteToolBar>


      <main className={`main-content ${isSidebarActive ? 'sidebar-open' : ''} ${isToolbarActive ? 'toolbar-active' : ''}`}>
        <h1>대머리 쫀득 쿠키</h1>
        <p>테마 토글 기능을 테스트해보세요.</p>
      </main>
    </div>
  )
}

export default App
