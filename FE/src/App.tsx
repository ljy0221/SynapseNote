import { useEffect, useRef } from 'react'; // useRef 추가
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useAuthStore } from './store/useAuthStore';
import { acceptInvitationApi } from './api/notes/AcceptInvitation.api';
import { useToastStore } from './store/useToastStore';

export default function App() {
    const { initializeAuth, logout } = useAuthStore();
    const isLogoutProcessing = useRef(false); // [New] 중복 처리 방지 플래그

    useEffect(() => {
        initializeAuth();

        // [Deep Link] 핸들러
        const handleDeepLink = (_event: any, url: string) => {
            console.log('[App] Deep Link Received:', url);

            if (url.startsWith('synapse://invite/')) {
                const code = url.split('synapse://invite/')[1];
                if (!code) return;

                const { isAuthenticated } = useAuthStore.getState();

                if (isAuthenticated) {
                    // 로그인 상태 -> 즉시 처리 (추후 API 연동 필요)
                    console.log('[App] Authenticated. Processing invite code:', code);
                    // 예: joinWorkspace(code);
                    // navigate(`/workspace/join/${code}`);
                } else {
                    // 미로그인 상태 -> 저장 후 로그인으로 이동
                    console.log('[App] Unauthenticated. Saving invite code and redirecting to login.');
                    sessionStorage.setItem('pendingInviteCode', code);
                    if (router && router.navigate) {
                        router.navigate('/login');
                    } else {
                        window.location.href = '/login';
                    }
                }
            }
        };

        // Electron 환경에서만 리스너 등록
        if (window.electronAPI) {
            window.electronAPI.onDeepLinkUrl(handleDeepLink);
        }

        const handleUnauthorized = () => {
            // 이미 처리 중이라면 무시
            if (isLogoutProcessing.current) return;

            isLogoutProcessing.current = true;
            console.warn('Session expired. Logging out...');

            // 1. 스토어 정리
            logout();

            // 2. 페이지 이동
            if (router && router.navigate) {
                router.navigate('/login');
            } else {
                window.location.href = '/login';
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            // 언마운트 시 리스너 제거 (ElectronAPI에 removeListener가 있는지 확인 필요, 없으면 생략)
            if (window.electronAPI && window.electronAPI.removeDeepLinkListener) {
                window.electronAPI.removeDeepLinkListener(handleDeepLink);
            }
        };
    }, [initializeAuth, logout]);

    return <RouterProvider router={router} />;
}