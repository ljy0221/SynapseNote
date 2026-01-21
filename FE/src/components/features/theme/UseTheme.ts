// src/features/theme/UseTheme.ts
import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState<boolean>(false);

    // 테마를 실제 시스템(DOM)에 적용하는 함수
    const applyTheme = useCallback((dark: boolean) => {
        setIsDark(dark);
        const mode = dark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem('app-theme', mode);
    }, []);

    // 초기 로드 시 저장된 설정 불러오기
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme === 'dark') {
            applyTheme(true);
        } else {
            applyTheme(false); // 기본값 light
        }
    }, [applyTheme]);

    const toggleTheme = () => applyTheme(!isDark);

    return { isDark, toggleTheme };
};