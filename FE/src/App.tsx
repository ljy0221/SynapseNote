import { useEffect, useRef } from 'react'; // useRef 추가
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useAuthStore } from './store/useAuthStore';
import { acceptInvitationApi } from './api/notes/AcceptInvitation.api';
import { useToastStore } from './store/useToastStore';

export default function App() {
    const { initializeAuth, logout } = useAuthStore();
    const isLogoutProcessing = useRef(false);

    // [Refactor] Deep Link 로직을 커스텀 훅으로 분리
    useDeepLink(router.navigate);

    useEffect(() => {
        initializeAuth();

        // (Original Deep Link logic removed from here)
        console.log('[App] Deep Link Received:', url);

        if (url.startsWith('synapse://invite/')) {
            const code = url.split('synapse://invite/')[1];
            if (!code) return;

            // [Fix] Race Condition 해결 \& 스토어 상태 확인
            const { isAuthenticated, accessToken } = useAuthStore.getState();
            const hasToken = !!accessToken;

            if (isAuthenticated || hasToken) {
                // 로그인 상태(또는 토큰 존재) -> 즉시 처리
                console.log('[App] Authenticated (or Token exists). Processing invite code:', code);
                try {
                    await acceptInvitationApi(code);
                    useToastStore.getState().showToast('가입 요청이 전송되었습니다. 소유자의 승인을 기다려주세요.', 'success');

                    // 성공 후 홈으로 이동
                    if (router && router.navigate) {
                        router.navigate('/home');
                    } else {
                        window.location.href = '/home';
                    }
                } catch (error: any) {
                    console.error('[App] Failed to accept invitation:', error);
                    const errorMsg = error.response?.data?.message || '';

                    // [Fix] 이미 가입/요청 상태인 경우 (409 Conflict)
                    if (error.response?.status === 409 || errorMsg.includes('이미') || errorMsg.includes('exists')) {
                        useToastStore.getState().showToast('이미 가입 요청이 전송된 상태입니다.', 'info');
                    } else {
                        useToastStore.getState().showToast(errorMsg || '초대 수락 중 오류가 발생했습니다.', 'error');
                    }

                    if (router && router.navigate) {
                        router.navigate('/home');
                    }
                }
            } else {
                // 미로그인 상태 -> 저장 후 로그인으로 이동
                console.log('[App] Unauthenticated. Saving invite code and redirecting to login.');
                localStorage.setItem('pendingInviteCode', code); // sessionStorage -> localStorage
                if (router && router.navigate) {
                    router.navigate('/login');
                } else {
                    window.location.href = '/login';
                }
            }
        }
    };
};

window.addEventListener('auth:unauthorized', handleUnauthorized);

return () => {
    window.removeEventListener('auth:unauthorized', handleUnauthorized);
};
    }, [initializeAuth, logout]);

return <RouterProvider router={router} />;
}