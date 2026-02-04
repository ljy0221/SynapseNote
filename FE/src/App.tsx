// FE/src/App.tsx
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import router from './router';

export default function App() {
    const { initializeAuth, logout } = useAuthStore();

    useEffect(() => {
        // 1. 초기 인증 상태 확인
        initializeAuth();

        // 2. Axios 인터셉터 등에서 발생하는 강제 로그아웃 이벤트 감지
        const handleUnauthorized = () => {
            console.warn('Session expired. Logging out...');
            logout();
            
            // RouterProvider 외부에서 네비게이션 처리
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