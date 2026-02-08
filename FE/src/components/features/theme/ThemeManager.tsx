import React from 'react';
import { useThemeStore } from '../../../store/useThemeStore';
import ThemeToggle from '../../common/themeToggle/ThemeToggle';

/**
 * ThemeManager (Feature Layer)
 * 비즈니스 로직(useThemeStore Hook)과 UI 컴포넌트(ThemeToggle - Common Layer)를 연결하는 역할을 합니다.
 */
export const ThemeManager: React.FC = () => {
    // 1. 순수 로직(Hook)에서 데이터와 함수를 가져옵니다.
    const { themeMode, toggleTheme } = useThemeStore();

    // 2. 디자인 조각(Common)에 로직을 연결하여 반환합니다.
    return (
        <ThemeToggle
            themeMode={themeMode}
            onToggle={toggleTheme}
        />
    );
};