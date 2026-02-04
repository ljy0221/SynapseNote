import { useEffect, useRef } from 'react'; // useRef 추가
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
    const { initializeAuth, logout } = useAuthStore();
    const isLogoutProcessing = useRef(false); // [New] 중복 처리 방지 플래그

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

            // (선택) 일정 시간 후 플래그 초기화 (사용자가 다시 로그인할 때 등)
            // 여기서는 페이지가 리프레시되거나 이동하므로 굳이 초기화하지 않아도 안전합니다.
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [initializeAuth, logout]);

    return <RouterProvider router={router} />;
}