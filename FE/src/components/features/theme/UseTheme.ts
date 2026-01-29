// src/features/theme/UseTheme.ts
import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'cookie' | 'dark' | 'deepblue';

export const useTheme = () => {
    // 초기값을 localStorage에서 읽어오거나 'light'로 설정
    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('app-theme');
        if (saved === 'dark' || saved === 'deepblue' || saved === 'light' || saved === 'cookie') {
            return saved as ThemeMode;
        }
        return 'light'; // 기본값
    });

    // 테마 변경 함수
    const toggleTheme = () => {
        setThemeMode((prev) => {
            if (prev === 'light') return 'cookie';
            if (prev === 'cookie') return 'dark';
            if (prev === 'dark') return 'deepblue';
            return 'light'; // deepblue -> light
        });
    };

    // toggleTheme 내부에서 setState를 사용하더라도, side effect로 DOM 업데이트가 필요함.
    // useEffect로 themeMode 변경 시 DOM 업데이트를 보장하는 것이 더 깔끔함.
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode);
        localStorage.setItem('app-theme', themeMode);
    }, [themeMode]);

    return { themeMode, toggleTheme };
};