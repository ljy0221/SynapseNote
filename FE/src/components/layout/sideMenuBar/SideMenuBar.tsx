import React from 'react';
import { SideMenuItem } from '../../common/sideMenuItem/SideMenuItem';
import './SideMenuBar.css';

export const SideMenuBar: React.FC = () => {
    const menuItems = [
        { name: '대시보드', path: '/home', icon: '🏠' },
        { name: '노트 에디터', path: '/note', icon: '📝' },
        { name: '마인드맵', path: '/mindmap', icon: '🧠' },
        { name: '추천 노트', path: '/recommend', icon: '✨' },
    ];

    return (
        <nav className="side-menu-bar">
            {/* 스타일은 CSS 파일에서 관리하므로 인라인 스타일은 최소화하거나 제거해도 좋습니다. */}
            <ul className="menu-list">
                {menuItems.map((item) => (
                    <li key={item.path}>
                        <SideMenuItem
                            to={item.path}
                            icon={item.icon}
                            label={item.name}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};