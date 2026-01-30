import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// 스타일 임포트
import './components/common/styles/Theme.css';
import './App.css';

// Context 임포트
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';

// 레이아웃 컴포넌트
import { Header } from './components/layout/header/Header';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { SideMenuBar } from './components/layout/sideMenuBar/SideMenuBar';

// 공통 컴포넌트
import ThemeToggle from './components/common/themeToggle/ThemeToggle';
import WindowControlButton from './components/common/WindowControlButton/WindowControlButton';
import { useTheme } from './components/features/theme/UseTheme';
import { DockerErrorModal } from './components/common/modal/DockerErrorModal';

// Electron 체크
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

// 페이지 컴포넌트
import Home from './pages/home/Home';
import Login from './pages/login/Login';
import OAuthCallback from './pages/login/OAuthCallback';
import Note from './pages/note/Note';
import MindMap from './pages/mindmap/MindMap';
import Bookmark from './pages/bookmark/Bookmark';

// 경로 설정
const SIDEBAR_ROUTES = ['/note'];
const TOOLBAR_ROUTES = ['/note'];

function AppContent() {
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isToolbarActive] = useState(true);
    const [dockerStatus, setDockerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
    const [dockerErrorType, setDockerErrorType] = useState<'installed' | 'running' | null>(null);
    const [isDockerErrorOpen, setIsDockerErrorOpen] = useState(false);

    const { themeMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isLoginPage = location.pathname === '/login';

    // Docker 헬스 체크
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
            console.error('[App] Docker health check failed:', error);
            setDockerStatus('error');
            setDockerErrorType('running');
            setIsDockerErrorOpen(true);
        }
    }

    useEffect(() => {
        checkDocker();
    }, []);

    const handleRetryDocker = () => {
        setIsDockerErrorOpen(false);
        setDockerStatus('checking');
        setTimeout(() => {
            checkDocker();
        }, 1000);
    };

    const handleCloseDockerError = () => {
        setIsDockerErrorOpen(false);
    };

    // Deep Link 리스너
    useEffect(() => {
        if (!isElectron || !window.ipcRenderer) return;

        window.ipcRenderer.on('deep-link-url', (_event, url: any) => {
            console.log('[App] Received deep link:', url);
            if (typeof url === 'string' && url.startsWith('synapse://')) {
                const path = url.replace('synapse://', '/');
                navigate(path);
            }
        });
    }, [navigate]);

    const toggleSidebar = () => setIsSidebarActive(prev => !prev);

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

    const isToolbarAllowed = TOOLBAR_ROUTES.some(path =>
        location.pathname.startsWith(path)
    );

    return (
        <div className="app-container">
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

            <DockerErrorModal
                isOpen={isDockerErrorOpen}
                type={dockerErrorType}
                onRetry={handleRetryDocker}
                onClose={handleCloseDockerError}
            />

            {!isLoginPage && (
                <>
                    <SideMenuBar />
                    {isSidebarAllowed && (
                        <Sidebar
                            isOpen={isSidebarActive}
                            onToggle={toggleSidebar}
                        />
                    )}
                </>
            )}

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