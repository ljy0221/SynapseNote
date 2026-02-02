import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserInfo, UserInfo } from '../api/authApi';
import { useToastStore } from './useToastStore';

interface AuthState {
    userInfo: UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    // Actions
    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshUserInfo: () => Promise<void>;
    initializeAuth: () => Promise<void>; // To be called on app mount
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            userInfo: null,
            isLoading: true, // Initial loading state
            isAuthenticated: false,

            login: async (token: string) => {
                set({ isLoading: true });
                try {
                    localStorage.setItem('authToken', token);
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
                    // Token might be expired, but we don't necessarily want to logout on every refresh error unless 401
                    // For now, mirroring UserContext logic: logout on error
                    console.error('Refresh user info failed:', error);
                    localStorage.removeItem('authToken');
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

                // If we already have persisted user info, we might want to trust it briefly
                // But generally safe to refresh
                try {
                    const info = await getUserInfo(token);
                    set({ userInfo: info, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    console.error('Auth initialization failed:', error);
                    localStorage.removeItem('authToken');
                    set({ userInfo: null, isAuthenticated: false, isLoading: false });
                    // Initial check might fail silently or show toast?
                    // UserContext showed toast "Session expired"
                    useToastStore.getState().showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
                }
            }
        }),
        {
            name: 'auth-storage', // key for localStorage
            partialize: (state) => ({ userInfo: state.userInfo, isAuthenticated: state.isAuthenticated }), // Only persist these
        }
    )
);
