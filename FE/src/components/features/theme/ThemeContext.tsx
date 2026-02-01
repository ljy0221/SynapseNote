import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'cookie' | 'dark' | 'deepblue';

interface ThemeContextType {
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 초기값을 localStorage에서 읽어오거나 'light'로 설정
    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('app-theme');
        if (saved && ['light', 'cookie', 'dark', 'deepblue'].includes(saved)) {
            return saved as ThemeMode;
        }
        return 'light'; // 기본값
    });

    // Theme 변경 시 DOM 및 LocalStorage 업데이트
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode);
        localStorage.setItem('app-theme', themeMode);
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode((prev) => {
            if (prev === 'light') return 'cookie';
            if (prev === 'cookie') return 'dark';
            if (prev === 'dark') return 'deepblue';
            return 'light';
        });
    };

    const setTheme = (mode: ThemeMode) => {
        setThemeMode(mode);
    };

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
