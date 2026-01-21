import React from 'react';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';
import SidebarActiveButton from '../../common/sidebarActiveButton/SidebarActiveButton.tsx';
import SearchBar from '../../common/searchBar/SearchBar.tsx'; // SearchBar 임포트

interface HeaderProps {
  isSidebarActive: boolean;
  onToggleSidebar: () => void;
}

/**
 * Header Component
 * common - feature - layout 구조에서 layout에 해당합니다.
 * 전체적인 레이아웃의 헤더 영역을 담당하며, 우측에 테마 토글 기능을 포함합니다.
 */
export const Header: React.FC<HeaderProps> = ({
  isSidebarActive,
  onToggleSidebar,
}) => {
    return (
        <header className="main-header">
            <div className="header-left">
                <SidebarActiveButton
                    isActive={isSidebarActive}
                    onToggle={onToggleSidebar}
                />
                {/* ✅ 임시 상태 표시 */}
                <span className="sidebar-state-text">
                    {isSidebarActive ? '열림' : '닫힘'}
                </span>
            </div>

            <div className="header-search-zone">
                <SearchBar />
            </div>
            <div className="header-right-zone">
                {/* Feature 레이어의 ThemeManager를 사용하여 테마 기능을 주입합니다 */}
                <ThemeManager />
            </div>
        </header>
    );
};