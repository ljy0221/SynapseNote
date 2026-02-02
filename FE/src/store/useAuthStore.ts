import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserInfo, UserInfo, updateNickname } from '../api/authApi';
import { useToastStore } from './useToastStore';

interface AuthState {
    userInfo: UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    /**
     * 로그아웃 처리
     * 1. 로컬 스토리지의 액세스 토큰 삭제
     * 2. 스토어 상태(유저 정보, 인증 상태) 초기화
     * 3. 로그아웃 완료 토스트 메시지 출력
     * 
     * @note Refresh Token은 HttpOnly Cookie로 관리되므로 클라이언트 JavaScript에서 직접 삭제할 수 없습니다.
     * 따라서 액세스 토큰을 폐기하여 클라이언트 세션을 종료하는 방식으로 처리합니다.
     */
    logout: () => void;
    refreshUserInfo: () => Promise<void>;
    initializeAuth: () => Promise<void>; // To be called on app mount
    updateUserNickname: (newNickname: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            userInfo: null,
            isLoading: true, // Initial loading state
            isAuthenticated: false,

            login: async (token: string, memberId?: string) => {
                set({ isLoading: true });
                try {
                    localStorage.setItem('authToken', token);
                    if (memberId) {
                        localStorage.setItem('memberId', memberId);
                    }
                    const info = await getUserInfo(token);
                    set({ userInfo: info, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    console.error('Login failed:', error);
                    localStorage.removeItem('authToken');
                    set({ userInfo: null, isAuthenticated: false, isLoading: false });
                    useToastStore.getState().showToast('로그인에 실패했습니다.', 'error');
                }
            },

            logout: () => {
                localStorage.removeItem('authToken');
                set({ userInfo: null, isAuthenticated: false, isLoading: false });
                useToastStore.getState().showToast('로그아웃 되었습니다.', 'info');
            },

            refreshUserInfo: async () => {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                set({ isLoading: true });
                try {
                    const info = await getUserInfo(token);
                    set({ userInfo: info, isAuthenticated: true, isLoading: false });

                } catch (error) {
                    // Token might be expired
                    console.error('Refresh user info failed:', error);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('memberId');
                    set({ userInfo: null, isAuthenticated: false, isLoading: false });
                    useToastStore.getState().showToast('세션이 만료되었습니다.', 'error');
                }
            },

            initializeAuth: async () => {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    set({ userInfo: null, isAuthenticated: false, isLoading: false });
                    return;
                }

                try {
                    const info = await getUserInfo(token);
                    set({ userInfo: info, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    console.error('Auth initialization failed:', error);
                    localStorage.removeItem('authToken');
                    set({ userInfo: null, isAuthenticated: false, isLoading: false });
                    useToastStore.getState().showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
                }
            },

            updateUserNickname: async (newNickname: string) => {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    useToastStore.getState().showToast('로그인이 필요합니다.', 'error');
                    return;
                }

                try {
                    await updateNickname(token, newNickname);
                    // 닉네임 변경 후 유저 정보 갱신
                    await get().refreshUserInfo();
                    useToastStore.getState().showToast('닉네임이 변경되었습니다.', 'success');
                } catch (error) {
                    console.error('Failed to update nickname store action:', error);
                    throw error; // 컴포넌트에서 에러 처리를 할 수 있도록 throw
                }
            }
        }),
        {
            name: 'auth-storage', // key for localStorage
            partialize: (state) => ({ userInfo: state.userInfo, isAuthenticated: state.isAuthenticated }), // Only persist these
        }
    )
);

