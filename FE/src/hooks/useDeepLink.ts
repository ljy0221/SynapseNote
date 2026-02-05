import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { acceptInvitationApi } from '../api/notes/AcceptInvitation.api';
import { NavigateFunction } from 'react-router-dom';

export const useDeepLink = (navigate: NavigateFunction | null) => {
    const { initializeAuth } = useAuthStore();

    useEffect(() => {
        const handleDeepLink = async (_event: any, url: string) => {
            console.log('[DeepLink] Received:', url);

            if (url.startsWith('synapse://invite/')) {
                const code = url.split('synapse://invite/')[1];
                if (!code) return;

                const { isAuthenticated, accessToken } = useAuthStore.getState();
                const hasToken = !!accessToken;

                if (isAuthenticated || hasToken) {
                    // 로그인 상태(또는 토큰 존재) -> 즉시 처리
                    console.log('[DeepLink] Authenticated. Processing invite code:', code);
                    try {
                        await acceptInvitationApi(code);
                        useToastStore.getState().showToast('가입 요청이 전송되었습니다. 소유자의 승인을 기다려주세요.', 'success');

                        if (navigate) {
                            navigate('/home');
                        } else {
                            window.location.href = '/home';
                        }
                    } catch (error: any) {
                        console.error('[DeepLink] Failed to accept invitation:', error);
                        const errorMsg = error.response?.data?.message || '';

                        // 409 Conflict: 이미 요청됨
                        if (error.response?.status === 409 || errorMsg.includes('이미') || errorMsg.includes('exists')) {
                            useToastStore.getState().showToast('이미 가입 요청이 전송된 상태입니다.', 'info');
                        } else {
                            useToastStore.getState().showToast(errorMsg || '초대 수락 중 오류가 발생했습니다.', 'error');
                        }

                        if (navigate) {
                            navigate('/home');
                        }
                    }
                } else {
                    // 미로그인 상태 -> 저장 후 로그인으로 이동
                    console.log('[DeepLink] Unauthenticated. Saving invite code and redirecting to login.');
                    localStorage.setItem('pendingInviteCode', code);
                    if (navigate) {
                        navigate('/login');
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

        return () => {
            if (window.electronAPI && window.electronAPI.removeDeepLinkListener) {
                window.electronAPI.removeDeepLinkListener(handleDeepLink);
            }
        };
    }, [initializeAuth, navigate]);
};
