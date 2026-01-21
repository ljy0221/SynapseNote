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
                {/* 이모지 아이콘 제거됨 - 타원형 디자인 적용 */}
            </span>
        </label>
    );
};

export default ThemeToggle;