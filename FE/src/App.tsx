import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// 스타일 임포트
import './components/common/styles/Theme.css';
import './App.css';

// 레이아웃 컴포넌트 (폴더: camelCase, 파일: PascalCase)
import { Header } from './components/layout/header/Header';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { SideMenuBar } from './components/layout/sideMenuBar/SideMenuBar';
import { NoteToolBar } from './components/layout/noteToolbar/NoteToolbar';

// 공통 컴포넌트
import WindowControlButton from './components/common/windowControlButton/WindowControlButton';
import ThemeToggle from './components/common/themeToggle/ThemeToggle';

// 페이지 컴포넌트
import Home from './pages/home/Home'; // home 폴더 안에 Home.tsx가 있다고 가정
import Login from './pages/login/Login';
import Note from './pages/note/Note';
import MindMap from './pages/mindmap/MindMap';
import Recommend from './pages/recommend/Recommend';
// 사이드바가 허용되는 경로
const SIDEBAR_ROUTES = ['/mindmap', '/note'];

function AppContent() {
    const [isSidebarActive, setIsSidebarActive] = useState(false); // 가변 사이드바 상태
    const [isToolbarActive, setIsToolbarActive] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleThemeToggle = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    const toggleSidebar = () => setIsSidebarActive(prev => !prev);



    
    /** Sidebar */
    const isSidebarAllowed = SIDEBAR_ROUTES.some(path =>
        location.pathname.startsWith(path)
    );
    useEffect(() => {
        if (isSidebarAllowed) {
        setIsSidebarActive(true);
        } else {
        setIsSidebarActive(false);
        }
    }, [isSidebarAllowed]);


    return (
        <div className="app-container">
            {/* 1. 헤더 영역 */}
            {isLoginPage ? (
                <div className="login-window-header">
                    <div className="header-spacer"></div>
                    <div className="header-right-zone">
                        <ThemeToggle isDark={theme === 'dark'} onToggle={handleThemeToggle} />
                        <WindowControlButton />
                    </div>
                </div>
            ) : (
                <Header
                    theme={theme}
                    onToggleTheme={handleThemeToggle}
                    onToggleSidebar={toggleSidebar}
                />
            )}

            {/* 2. 네비게이션 및 사이드바 영역 (로그인 아닐 때만) */}
            {!isLoginPage && (
                <>
                    {/* 최좌측 고정 네비게이션 바 */}
                    <SideMenuBar />

                    {/* 헤더 버튼으로 열고 닫는 가변 사이드바 (디렉토리 등) */}
                    {isSidebarAllowed && (
                    <Sidebar 
                        isOpen={isSidebarActive}
                        onToggle={toggleSidebar}
                    >
                        <div className="sidebar-content">
                        {/* 추후 이곳에 디렉토리 구조 등이 들어감 */}
                        <p>Directory Structure</p>
                        </div>
                    </Sidebar>
                    )}
                </>
            )}

            {/* 3. 메인 콘텐츠 영역 */}
            {/* 클래스명을 통해 SideMenuBar(고정)와 Sidebar(가변)의 너비만큼 마진 조정 */}
            <main
                className={[
                    !isLoginPage ? 'main-content' : '',
                    !isLoginPage && isSidebarAllowed && isSidebarActive ? 'sidebar-open' : '',
                    !isLoginPage && isToolbarActive ? 'toolbar-open' : '',
                ].join(' ')}
            >


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