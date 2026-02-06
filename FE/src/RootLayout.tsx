import { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// 스타일 (경로 수정 필요)
import './components/common/styles/Theme.css';
import './App.css';

// Zustand Stores
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { useToastStore } from './store/useToastStore';

// 레이아웃 컴포넌트 (Lazy Loading)
const Header = lazy(() => import('./components/layout/header/Header').then(module => ({ default: module.Header })));
const Sidebar = lazy(() => import('./components/layout/sidebar/Sidebar').then(module => ({ default: module.Sidebar })));
const SideMenuBar = lazy(() => import('./components/layout/sideMenuBar/SideMenuBar').then(module => ({ default: module.SideMenuBar })));

// 공통 컴포넌트
import ThemeToggle from './components/common/themeToggle/ThemeToggle';
import { ToastNotification } from './components/common/toast/ToastNotification';
import GlobalModal from './components/common/modal/GlobalModal';

// Less critical components (Lazy)
const WindowControlButton = lazy(() => import('./components/common/WindowControlButton/WindowControlButton'));
const DockerErrorModal = lazy(() => import('./components/common/modal/DockerErrorModal').then(module => ({ default: module.DockerErrorModal })));

// 전자 확인
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

const SIDEBAR_ROUTES = ['/note', '/home'];
const FIXED_SIDEBAR_ROUTES = ['/home', '/note', '/mindmap']; // [New] 항상 열림 처리할 경로
const TOOLBAR_ROUTES = ['/note'];

// Web Guard용 Whitelist
const WEB_WHITELIST = ['/login', '/invite', '/notes/invitation', '/auth'];

// New Import
import { WebRestrictedOverlay } from './components/common/layout/WebRestrictedOverlay';

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

        const handleDeepLink = (_event: any, url: string) => {
            console.log('[App] Received deep link:', url);
            if (typeof url === 'string' && url.startsWith('synapse://')) {
                try {
                    // 1. 토큰 추출 및 자동 로그인
                    // URL 파싱을 위해 임시로 http 프로토콜 사용 (custom protocol 파싱 이슈 방지)
                    // 또는 단순히 문자열 파싱
                    const urlObj = new URL(url);
                    const token = urlObj.searchParams.get('token');

                    if (token) {
                        console.log('[App] Auto-login detected from deep link');
                        // Zustand Store 직접 접근하여 로그인 처리
                        useAuthStore.getState().login(token);
                    }

                    // 2. 경로 이동 (토큰 파라미터 제거)
                    let path = url.replace('synapse://', '/');
                    // 쿼리 스트링 제거 (미관상)
                    if (path.includes('?')) {
                        path = path.split('?')[0];
                    }
                    navigate(path);
                } catch (error) {
                    console.error('[App] Deep link error:', error);
                    // Fallback
                    const path = url.replace('synapse://', '/').split('?')[0];
                    navigate(path);
                }
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

    // [New] Web Guard Logic
    // 일렉트론이 아니고, 화이트리스트에 없는 경로라면 Overlay 표시
    const isAllowedWebPath = WEB_WHITELIST.some(path => location.pathname.startsWith(path));
    const showWebRestriction = !isElectron && !isAllowedWebPath;

    // [Fix] URL을 /home으로 정리 (404나 이상한 경로 진입 시 주소창도 깔끔하게 /home으로 변경)
    useEffect(() => {
        if (showWebRestriction && location.pathname !== '/home') {
            navigate('/home', { replace: true });
        }
    }, [showWebRestriction, location.pathname, navigate]);

    if (showWebRestriction) {
        return <WebRestrictedOverlay />;
    }

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
                        {isElectron && (
                            <Suspense fallback={null}>
                                <WindowControlButton />
                            </Suspense>
                        )}
                    </div>
                </div>
            ) : (
                <Suspense fallback={null}>
                    <Header isSidebarActive={isSidebarActive} onToggleSidebar={toggleSidebar} />
                </Suspense>
            )}

            <Suspense fallback={null}>
                <DockerErrorModal
                    isOpen={isDockerErrorOpen}
                    type={dockerErrorType}
                    onRetry={handleRetryDocker}
                    onClose={() => setIsDockerErrorOpen(false)}
                />
            </Suspense>

            {!isLoginPage && (
                <Suspense fallback={null}>
                    <SideMenuBar />
                    {(isSidebarAllowed || isFixedSidebar) && (
                        <Sidebar
                            isOpen={isSidebarActive}
                            onToggle={toggleSidebar}
                            showToggle={!isFixedSidebar} // 고정이면 토글 버튼 숨김
                        />
                    )}
                </Suspense>
            )}

            <main
                className={[
                    !isLoginPage ? 'main-content' : '',
                    !isLoginPage && isSidebarActive ? 'sidebar-open' : '',
                    !isLoginPage && isToolbarActive && isToolbarAllowed ? 'toolbar-open' : '',
                ].join(' ')}
            >
                {/* Router Outlet: 자식 라우트 컴포넌트가 렌더링되는 위치 */}
                <Outlet />
            </main>
        </div>
    );
}