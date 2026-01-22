import React from 'react';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';
import SidebarActiveButton from '../../common/sidebarActiveButton/SidebarActiveButton.tsx';
import SearchBar from '../../common/searchBar/SearchBar.tsx';
import WindowControlButton from '../../common/WindowControlButton/WindowControlButton.tsx'; // 임포트 추가

interface HeaderProps {
    isSidebarActive: boolean;
    onToggleSidebar: () => void;
}

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
            </div>

            {/* 왼쪽과 중앙 사이의 드래그 핸들 */}
            <div className="drag-handle" />

            <div className="header-search-zone">
                <SearchBar />
            </div>

            {/* 중앙과 오른쪽 사이의 드래그 핸들 */}
            <div className="drag-handle" />

            <div className="header-right-zone">
                {/* 테마 토글 버튼 */}
                <ThemeManager />
                {/* 가장 우측에 배치되는 맥 스타일 컨트롤 버튼 */}
                <WindowControlButton />
            </div>
        </header>
    );
};