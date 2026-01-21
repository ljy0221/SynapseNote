import React from 'react';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';

/**
 * Header Component
 * common - feature - layout 구조에서 layout에 해당합니다.
 * 전체적인 레이아웃의 헤더 영역을 담당하며, 우측에 테마 토글 기능을 포함합니다.
 */
export const Header: React.FC = () => {
    return (
        <header className="main-header">
            <div className="header-left">
                <span className="header-logo">LOGO</span>
            </div>
            <div className="header-right-zone">
                {/* Feature 레이어의 ThemeManager를 사용하여 테마 기능을 주입합니다 */}
                <ThemeManager />
            </div>
        </header>
    );
};