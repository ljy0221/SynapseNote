import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// 스타일 임포트 (Theme.css를 가장 먼저 불러옵니다)
import './components/common/styles/Theme.css';
import './App.css';

import { Header } from './components/layout/header/Header';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { SideMenuBar } from './components/layout/sideMenuBar/SideMenuBar';
import { NoteToolBar } from './components/layout/noteToolbar/NoteToolbar';

// 공통 컴포넌트
import WindowControlButton from './components/common/windowControlButton/WindowControlButton';
import ThemeToggle from './components/common/themeToggle/ThemeToggle';

// 페이지 컴포넌트
import Home from './pages/Home';
import Login from './pages/Login';
import Note from './pages/Note';
import MindMap from './pages/MindMap';
import Recommend from './pages/Recommend';

function AppContent() {
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isToolbarActive, setIsToolbarActive] = useState(true);

    // Synapse 기본 테마인 'dark'로 초기화
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    // Theme.css의 변수들이 작동하도록 :root의 data-theme 변경
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <div className="app-container">
            {isLoginPage ? (
                <div className="login-window-header">
                    <div className="header-spacer"></div>
                    <div className="header-right-zone">
                        <ThemeToggle
                            isDark={theme === 'dark'}
                            onToggle={handleThemeToggle}
                        />
                        <WindowControlButton />
                    </div>
                </div>
            ) : (
                <Header
                    theme={theme}
                    onToggleTheme={handleThemeToggle}
                    isSidebarActive={isSidebarActive}
                    onToggleSidebar={() => setIsSidebarActive(prev => !prev)}
                />
            )}

            {!isLoginPage && (
                <>
                    <Sidebar isOpen={isSidebarActive}>
                        <SideMenuBar />
                    </Sidebar>
                    <NoteToolBar isOpen={isToolbarActive}>
                        <div className="toolbar-header">
                            <h4>Note Tool</h4>
                        </div>
                    </NoteToolBar>
                </>
            )}

            <main className={isLoginPage ? "full-page" : `main-content ${isSidebarActive ? 'sidebar-open' : ''}`}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/note" element={<Note />} />
                    <Route path="/mindmap" element={<MindMap />} />
                    <Route path="/recommend" element={<Recommend />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}