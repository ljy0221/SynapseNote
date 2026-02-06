import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateTheme, Theme } from '../api/authApi';

export type ThemeMode = 'light' | 'cookie' | 'dark' | 'deepblue';

// ThemeMode를 백엔드 Theme 타입으로 변환
const toBackendTheme = (mode: ThemeMode): Theme => {
    return mode.toUpperCase() as Theme;
};

interface ThemeState {
    themeMode: ThemeMode;
    toggleTheme: () => Promise<void>;
    setTheme: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeMode: 'light', // Default initial state, will be overwritten by persist if storage exists
            toggleTheme: async () => {
                const currentMode = get().themeMode;
                const nextTheme: Record<ThemeMode, ThemeMode> = {
                    light: 'cookie',
                    cookie: 'dark',
                    dark: 'deepblue',
                    deepblue: 'light',
                };
                const newMode = nextTheme[currentMode];

                try {
                    // 백엔드에 테마 변경 요청
                    await updateTheme(toBackendTheme(newMode));
                    set({ themeMode: newMode });
                } catch (error) {
                    console.error('Failed to update theme:', error);
                    // 에러가 발생해도 로컬 상태는 변경 (UX 우선)
                    set({ themeMode: newMode });
                }
            },
            setTheme: async (mode) => {
                try {
                    // 백엔드에 테마 변경 요청
                    await updateTheme(toBackendTheme(mode));
                    set({ themeMode: mode });
                } catch (error) {
                    console.error('Failed to update theme:', error);
                    // 에러가 발생해도 로컬 상태는 변경 (UX 우선)
                    set({ themeMode: mode });
                }
            },
        }),
        {
            name: 'app-theme', // Key for localStorage
            // We can add onRehydrateStorage if we want to sync with DOM immediately, 
            // but we will stick to a useEffect in App.tsx or similar for DOM side effects to keep store pure-ish.
            // Actually, `persist` will handle saving to localStorage.
            // But we need to update `data-theme` attribute on the html element.
        }
    )
);
