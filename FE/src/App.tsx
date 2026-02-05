import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useAuthStore } from './store/useAuthStore';
import { useDeepLink } from './hooks/useDeepLink';

export default function App() {
    const { initializeAuth, logout } = useAuthStore();
    const isLogoutProcessing = useRef(false);

    // [Refactor] Deep Link 로직을 커스텀 훅으로 분리
    useDeepLink(router.navigate);

    useEffect(() => {
        initializeAuth();

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
        };
    }, [initializeAuth, logout]);

    return <RouterProvider router={router} />;
}