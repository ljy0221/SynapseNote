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
// 공통 컴포넌트
import ThemeToggle from './components/common/themeToggle/ThemeToggle';
import WindowControlButton from './components/common/WindowControlButton/WindowControlButton';
import { useTheme, ThemeProvider } from './components/features/theme/ThemeContext'; // Context 사용
import { DockerErrorModal } from './components/common/modal/DockerErrorModal'; // Docker 에러 모달 추가

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
const SIDEBAR_ROUTES = ['/note'];
// 툴바가 허용되는 경로 (우측 여백)
const TOOLBAR_ROUTES = ['/note'];

function AppContent() {
    const [isSidebarActive, setIsSidebarActive] = useState(false); // 가변 사이드바 상태
    const [isToolbarActive] = useState(true);
    // const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // 기존 로컬 state 삭제
    const [dockerStatus, setDockerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
    const [dockerErrorType, setDockerErrorType] = useState<'installed' | 'running' | null>(null);
    const [isDockerErrorOpen, setIsDockerErrorOpen] = useState(false);

    // 전역 테마 훅 사용
    const { themeMode, toggleTheme } = useTheme();

    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    // useEffect(() => {
    //     document.documentElement.setAttribute('data-theme', theme);
    // }, [theme]); // useTheme 내부에서 처리하므로 삭제

    // Docker 헬스 체크 함수
    async function checkDocker() {
        if (!isElectron) {
            setDockerStatus('ok');
            return;
        }

        try {
            const installed = await (window as any).dockerAPI.checkInstalled();
            if (!installed) {
                setDockerStatus('error');
                setDockerErrorType('installed');
                setIsDockerErrorOpen(true);
                return;
            }

            const running = await (window as any).dockerAPI.checkRunning();
            if (!running) {
                setDockerStatus('error');
                setDockerErrorType('running');
                setIsDockerErrorOpen(true);
                return;
            }

            setDockerStatus('ok');
            setDockerErrorType(null);
            setIsDockerErrorOpen(false);
        } catch (error) {
            // API 호출 실패 또는 기타 에러
            console.error('[App] Docker health check failed:', error);

            // 상세 에러 내용을 로깅하되, 사용자에게는 우선 '실행 중이지 않음'으로 안내하여 재시도를 유도
            // 추후 에러 타입 세분화 검토 가능 (예: error instanceof DockerNotFoundError 등)
            setDockerStatus('error');
            setDockerErrorType('running');
            setIsDockerErrorOpen(true);
        }
    }

    // 초기 실행
    useEffect(() => {
        checkDocker();
    }, []);

    const handleRetryDocker = () => {
        setIsDockerErrorOpen(false); // 일단 닫고
        setDockerStatus('checking');
        // 잠시 후 재시도 (UX상 깜빡임 방지 및 실제 실행 시간 고려)
        setTimeout(() => {
            checkDocker();
        }, 1000);
    };

    const handleCloseDockerError = () => {
        setIsDockerErrorOpen(false);
    };

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

    // const handleThemeToggle = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light')); // 삭제
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
                        <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
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
            <DockerErrorModal
                isOpen={isDockerErrorOpen}
                type={dockerErrorType}
                onRetry={handleRetryDocker}
                onClose={handleCloseDockerError}
            />
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
                    <ThemeProvider>
                        <AppContent />
                    </ThemeProvider>
                </UserProvider>
            </ToastProvider>
        </Router>
    );
}