import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// 스타일 임포트
import './components/common/styles/Theme.css';
import './App.css';

// Context 임포트
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';

// 레이아웃 컴포넌트 (폴더: camelCase, 파일: PascalCase)
import { Header } from './components/layout/header/Header';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { SideMenuBar } from './components/layout/sideMenuBar/SideMenuBar';


// 공통 컴포넌트
import ThemeToggle from './components/common/themeToggle/ThemeToggle';
import WindowControlButton from './components/common/WindowControlButton/WindowControlButton';

// Electron 전용 컴포넌트 (웹 빌드에서는 사용 안 함)
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

// 페이지 컴포넌트
import Home from './pages/home/Home'; // home 폴더 안에 Home.tsx가 있다고 가정
import Login from './pages/login/Login';
import OAuthCallback from './pages/login/OAuthCallback';
import Note from './pages/note/Note';
import MindMap from './pages/mindmap/MindMap';
import Bookmark from './pages/bookmark/Bookmark';
// 사이드바가 허용되는 경로
const SIDEBAR_ROUTES = ['/mindmap', '/note'];
// 툴바가 허용되는 경로 (우측 여백)
const TOOLBAR_ROUTES = ['/note'];

function AppContent() {
    const [isSidebarActive, setIsSidebarActive] = useState(false); // 가변 사이드바 상태
    const [isToolbarActive] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [dockerStatus, setDockerStatus] = useState<'checking' | 'ok' | 'error'>('checking');

    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Docker 헬스 체크 (Electron 환경에서만)
    useEffect(() => {
        if (!isElectron) {
            setDockerStatus('ok'); // 웹 환경에서는 Docker 체크 건너뛰기
            return;
        }

        async function checkDocker() {
            try {
                const installed = await (window as any).dockerAPI.checkInstalled();
                if (!installed) {
                    setDockerStatus('error');
                    alert('Docker가 설치되지 않았습니다.\n\nDocker Desktop을 설치해주세요.\nhttps://www.docker.com/products/docker-desktop/');
                    return;
                }

                const running = await (window as any).dockerAPI.checkRunning();
                if (!running) {
                    setDockerStatus('error');
                    alert('Docker가 실행되지 않았습니다.\n\nDocker Desktop을 실행해주세요.');
                    return;
                }

                setDockerStatus('ok');
            } catch (error) {
                console.error('Docker 상태 확인 실패:', error);
                setDockerStatus('error');
            }
        }

        checkDocker();
    }, []);

    // Deep Link 리스너
    const navigate = useNavigate(); // AppContent는 Router 내부이므로 사용 가능
    useEffect(() => {
        // 일렉트론 환경에서만 Deep Link URL 처리
        if (!isElectron || !window.ipcRenderer) return;

        window.ipcRenderer.on('deep-link-url', (_event, url: any) => {
            console.log('[App] Received deep link:', url);
            if (typeof url === 'string' && url.startsWith('synapse://')) {
                // "synapse://auth/google/callback?code=..." -> "/auth/google/callback?code=..."
                const path = url.replace('synapse://', '/');
                navigate(path);
            }
        });
    }, [navigate]);

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

    /** Toolbar */
    const isToolbarAllowed = TOOLBAR_ROUTES.some(path =>
        location.pathname.startsWith(path)
    );

    return (
        <div className="app-container">
            {/* 1. 헤더 영역 */}
            {isLoginPage ? (
                <div className="login-window-header">
                    <div className="header-spacer"></div>
                    <div className="header-right-zone">
                        <ThemeToggle isDark={theme === 'dark'} onToggle={handleThemeToggle} />
                        {isElectron && <WindowControlButton />}
                    </div>
                </div>
            ) : (
                <Header
                    isSidebarActive={isSidebarActive}
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
                        />
                    )}
                </>
            )}

            {/* 3. 메인 콘텐츠 영역 */}
            {/* 클래스명을 통해 SideMenuBar(고정)와 Sidebar(가변)의 너비만큼 마진 조정 */}
            <main
                className={[
                    !isLoginPage ? 'main-content' : '',
                    !isLoginPage && isSidebarAllowed && isSidebarActive ? 'sidebar-open' : '',
                    !isLoginPage && isToolbarActive && isToolbarAllowed ? 'toolbar-open' : '',
                ].join(' ')}
            >


                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/auth/:provider/callback" element={<OAuthCallback />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/note" element={<Note />} />
                    <Route path="/mindmap" element={<MindMap />} />
                    <Route path="/recommend" element={<Bookmark />} />
                </Routes>
            </main>
        </div>
    );
}



export default function App() {
    return (
        <Router>
            <ToastProvider>
                <UserProvider>
                    <AppContent />
                </UserProvider>
            </ToastProvider>
        </Router>
    );
}