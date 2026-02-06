import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserInfo, UserInfo } from '../api/authApi';
import { useToastStore } from './useToastStore';

interface AuthState {
    userInfo: UserInfo | null;
    accessToken: string | null; // [New] Store에서 토큰 관리
    isLoading: boolean;
    isAuthenticated: boolean;

    login: (token: string) => Promise<void>;
    logout: () => void;
    setAccessToken: (token: string) => void; // [New] 토큰 갱신용 액션
    refreshUserInfo: () => Promise<void>;
    initializeAuth: () => Promise<void>;
    updateUserNickname: (newNickname: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            userInfo: null,
            accessToken: null, // 초기값
            isLoading: true,
            isAuthenticated: false,

            login: async (token: string) => {
                set({ isLoading: true });
                try {
                    // ✅ 먼저 토큰을 store에 저장 (인터셉터가 사용할 수 있도록)
                    set({ accessToken: token });

                    // ✅ 그 다음 유저 정보 요청 (이제 인터셉터가 토큰을 찾을 수 있음)
                    const info = await getUserInfo();

                    set({
                        userInfo: info,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Login failed:', error);
                    set({ accessToken: null, userInfo: null, isAuthenticated: false, isLoading: false });
                    useToastStore.getState().showToast('로그인에 실패했습니다.', 'error');
                }
            },

            logout: () => {
                // persist가 로컬 스토리지도 함께 비워줍니다.
                set({ accessToken: null, userInfo: null, isAuthenticated: false, isLoading: false });
                useToastStore.getState().showToast('로그아웃 되었습니다.', 'info');
            },

            setAccessToken: (token: string) => {
                // 리프레시 토큰으로 발급받은 새 액세스 토큰 저장
                set({ accessToken: token, isAuthenticated: true });
            },

            refreshUserInfo: async () => {
                const token = get().accessToken; // state에서 가져옴
                if (!token) return;

                set({ isLoading: true });
                try {
                    const info = await getUserInfo();
                    set({ userInfo: info, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    console.error('Refresh user info failed:', error);
                    get().logout(); // 내부 액션 호출
                    useToastStore.getState().showToast('세션이 만료되었습니다.', 'error');
                }
            },

            initializeAuth: async () => {
                const token = get().accessToken; // persist에 의해 복원된 값
                if (!token) {
                    set({ userInfo: null, isAuthenticated: false, isLoading: false });
                    return;
                }

                // 유효성 검증을 위해 유저 정보 재요청
                try {
                    const info = await getUserInfo();
                    set({ userInfo: info, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    get().logout();
                }
            },

            updateUserNickname: async (_newNickname: string) => {
                const token = get().accessToken;
                if (!token) return;
                // ... (기존 로직 동일)
            }
        }),
        {
            name: 'auth-storage',
            // accessToken도 영속화 대상에 포함
            partialize: (state) => ({
                userInfo: state.userInfo,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);