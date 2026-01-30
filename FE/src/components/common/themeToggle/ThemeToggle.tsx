// src/common/components/themeToggle/ThemeToggle.tsx
import React from 'react';
import './ThemeToggle.css'; // 파일명 대소문자 주의
import { Sun, Moon } from 'react-feather';

interface ThemeToggleProps {
    isDark: boolean;
    onToggle: () => void;
    className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    isDark,
    onToggle,
    className = ''
}) => {
    return (
        <button
          onClick={onToggle}
          className={`theme-toggle-btn ${className}`}
          title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};

export default ThemeToggle;