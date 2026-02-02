import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'cookie' | 'dark' | 'deepblue';

interface ThemeState {
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            themeMode: 'light', // Default initial state, will be overwritten by persist if storage exists
            toggleTheme: () =>
                set((state) => {
                    const nextTheme: Record<ThemeMode, ThemeMode> = {
                        light: 'cookie',
                        cookie: 'dark',
                        dark: 'deepblue',
                        deepblue: 'light',
                    };
                    return { themeMode: nextTheme[state.themeMode] };
                }),
            setTheme: (mode) => set({ themeMode: mode }),
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
