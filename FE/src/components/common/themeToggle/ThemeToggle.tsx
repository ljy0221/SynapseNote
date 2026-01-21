// src/common/components/themeToggle/ThemeToggle.tsx
import React from 'react';
import './ThemeToggle.css'; // 파일명 대소문자 주의

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
        <label
            className={`toggle-wrapper ${className}`}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
            <input
                type="checkbox"
                className="toggle-checkbox"
                checked={isDark}
                onChange={onToggle}
                /* 접근성을 위한 속성 추가 */
                aria-label="테마 전환 스위치"
                role="switch"
                aria-checked={isDark}
            />
            <span className="toggle-slider">
                {/* 순서 주의: CSS에서 justify-content: space-between을 썼다면
                   아이콘 배치 순서에 따라 달과 해의 위치가 결정됩니다.
                */}
                <span className="icon">🌙</span>
                <span className="icon">☀️</span>
            </span>
        </label>
    );
};

export default ThemeToggle;