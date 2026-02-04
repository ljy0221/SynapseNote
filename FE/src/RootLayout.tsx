import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// 스타일 (경로 수정 필요)
import './components/common/styles/Theme.css';
import './App.css';

// Zustand Stores
import { useThemeStore } from './store/useThemeStore';
import { useToastStore } from './store/useToastStore';

// 레이아웃 컴포넌트
import { Header } from './components/layout/header/Header';
import { Sidebar } from './components/layout/sidebar/Sidebar';
import { SideMenuBar } from './components/layout/sideMenuBar/SideMenuBar';

// 공통 컴포넌트
import ThemeToggle from './components/common/themeToggle/ThemeToggle';
import WindowControlButton from './components/common/WindowControlButton/WindowControlButton';
import { DockerErrorModal } from './components/common/modal/DockerErrorModal';
import { ToastNotification } from './components/common/toast/ToastNotification';
import GlobalModal from './components/common/modal/GlobalModal';

// 전자 확인
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

const SIDEBAR_ROUTES = ['/note', '/home'];
const FIXED_SIDEBAR_ROUTES = ['/home']; // [New] 항상 열림 처리할 경로
const TOOLBAR_ROUTES = ['/note'];

export default function RootLayout() {
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const [isToolbarActive] = useState(true);
    const [dockerErrorType, setDockerErrorType] = useState<'installed' | 'running' | null>(null);
    const [isDockerErrorOpen, setIsDockerErrorOpen] = useState(false);

    // Zustand Hooks
    const { themeMode, toggleTheme } = useThemeStore();
    const { message, isVisible, type, closeToast } = useToastStore();

    const location = useLocation();
    const navigate = useNavigate();
    const isLoginPage = location.pathname === '/login';

    // Theme Synchronization
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode);
    }, [themeMode]);

    // Docker 헬스 체크
    async function checkDocker() {
        if (!isElectron) return;

        try {
            const installed = await (window as any).dockerAPI.checkInstalled();
            if (!installed) {
                setDockerErrorType('installed');
                setIsDockerErrorOpen(true);
                return;
            }

            const running = await (window as any).dockerAPI.checkRunning();
            if (!running) {
                setDockerErrorType('running');
                setIsDockerErrorOpen(true);
                return;
            }

            setDockerErrorType(null);
            setIsDockerErrorOpen(false);
        } catch (error) {
            console.error('[App] Docker health check failed:', error);
            setDockerErrorType('running');
            setIsDockerErrorOpen(true);
        }
    }

    useEffect(() => {
        checkDocker();
    }, []);

    const handleRetryDocker = () => {
        setIsDockerErrorOpen(false);
        setTimeout(() => checkDocker(), 1000);
    };

    // Deep Link 리스너
    useEffect(() => {
        if (!isElectron || !window.ipcRenderer) return;

        const handleDeepLink = (_event: any, url: any) => {
            console.log('[App] Received deep link:', url);
            if (typeof url === 'string' && url.startsWith('synapse://')) {
                const path = url.replace('synapse://', '/');
                navigate(path);
            }
        };

        window.ipcRenderer.on('deep-link-url', handleDeepLink);

        // [Fix] removeAllListeners가 함수인지 확인 후 호출
        return () => {
            if (typeof window.ipcRenderer.removeAllListeners === 'function') {
                window.ipcRenderer.removeAllListeners('deep-link-url');
            } else if (typeof window.ipcRenderer.removeListener === 'function') {
                // removeAllListeners가 없고 removeListener가 있다면 이를 사용
                window.ipcRenderer.removeListener('deep-link-url', handleDeepLink);
            } else {
                // 둘 다 없다면 콘솔 경고 (선택 사항)
                console.warn('[RootLayout] ipcRenderer listener cleanup skipped: methods not available');
            }
        };
    }, [navigate]);

    const toggleSidebar = () => setIsSidebarActive((prev) => !prev);

    // Sidebar & Toolbar Visibility Logic
    const isSidebarAllowed = SIDEBAR_ROUTES.some((path) => location.pathname.startsWith(path));
    const isFixedSidebar = FIXED_SIDEBAR_ROUTES.some((path) => location.pathname.startsWith(path)); // [New]
    const isToolbarAllowed = TOOLBAR_ROUTES.some((path) => location.pathname.startsWith(path));

    useEffect(() => {
        // 고정 사이드바인 경우 무조건 열림
        if (isFixedSidebar) {
            setIsSidebarActive(true);
        } else {
            setIsSidebarActive(isSidebarAllowed);
        }
    }, [isSidebarAllowed, isFixedSidebar]);

    return (
        <div className="app-container">
            <ToastNotification
                message={message}
                isVisible={isVisible}
                onClose={closeToast}
                type={type}
            />
            <GlobalModal />

            {isLoginPage ? (
                <div className="login-window-header">
                    <div className="header-spacer"></div>
                    <div className="header-right-zone">
                        <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
                        {isElectron && <WindowControlButton />}
                    </div>
                </div>
            ) : (
                <Header isSidebarActive={isSidebarActive} onToggleSidebar={toggleSidebar} />
            )}

            <DockerErrorModal
                isOpen={isDockerErrorOpen}
                type={dockerErrorType}
                onRetry={handleRetryDocker}
                onClose={() => setIsDockerErrorOpen(false)}
            />

            {!isLoginPage && (
                <>
                    <SideMenuBar />
                    {(isSidebarAllowed || isFixedSidebar) && (
                        <Sidebar
                            isOpen={isSidebarActive}
                            onToggle={toggleSidebar}
                            showToggle={!isFixedSidebar} // 고정이면 토글 버튼 숨김
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
                {/* Router Outlet: 자식 라우트 컴포넌트가 렌더링되는 위치 */}
                <Outlet />
            </main>
        </div>
    );
}