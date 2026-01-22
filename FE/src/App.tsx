import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Navigate 추가
import { Header } from './components/layout/header/Header';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { NoteToolBar } from './components/layout/noteToolbar/NoteToolbar';

// 페이지 컴포넌트들 임포트
import Home from './pages/Home';
import Login from './pages/Login';
import Note from './pages/Note';
import MindMap from './pages/MindMap';
import Recommend from './pages/Recommend';

import './App.css';

function App() {
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isToolbarActive] = useState(true);

    // 현재 경로가 로그인 페이지인지 확인 (로그인 페이지에서는 레이아웃을 숨기기 위함)
    // 참고: 윈도우 객체를 직접 참조하므로 간단한 테스트용으로 적합합니다.
    const isLoginPage = window.location.pathname === '/login';

    return (
        <Router>
            <div className="app-container">
                {/* 1. 로그인 페이지가 아닐 때만 공통 레이아웃을 렌더링합니다. */}
                {!isLoginPage && (
                    <>
                        <Header
                            isSidebarActive={isSidebarActive}
                            onToggleSidebar={() => setIsSidebarActive(prev => !prev)}
                        />
                        <Sidebar isOpen={isSidebarActive}>
                            <h3>Sidebar</h3>
                        </Sidebar>
                        <NoteToolBar isOpen={isToolbarActive}>
                            <div className="toolbar-header">
                                <h4>Note Tool</h4>
                            </div>
                        </NoteToolBar>
                    </>
                )}

                {/* 2. 로그인 여부에 따라 main-content의 스타일 클래스를 조절합니다. */}
                <main className={isLoginPage ? "full-page" : `main-content ${isSidebarActive ? 'sidebar-open' : ''} ${isToolbarActive ? 'toolbar-active' : ''}`}>
                    <Routes>
                        {/* 3. 기본 경로(/)로 접속 시 /login으로 자동 리다이렉트 합니다. */}
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        <Route path="/login" element={<Login />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/note" element={<Note />} />
                        <Route path="/mindmap" element={<MindMap />} />
                        <Route path="/recommend" element={<Recommend />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;