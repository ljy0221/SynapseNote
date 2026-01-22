import React from 'react';
import { LayoutDashboard, FileText, Network, Sparkles, Settings } from 'lucide-react';
import { SideMenuButton } from '../../common/sideMenuButton/SideMenuButton';
import './SideMenuBar.css';

export const SideMenuBar: React.FC = () => {
    return (
        <nav className="side-menu-bar">
            {/* 상단: 주요 페이지 이동 버튼들 */}
            <div className="top-section">
                <SideMenuButton to="/home" icon={<LayoutDashboard size={22} />} label="홈" />
                <SideMenuButton to="/note" icon={<FileText size={22} />} label="노트" />
                <SideMenuButton to="/mindmap" icon={<Network size={22} />} label="마인드맵" />
                <SideMenuButton to="/recommend" icon={<Sparkles size={22} />} label="추천" />
            </div>

            {/* 하단: 설정 등 유틸리티 버튼 */}
            <div className="bottom-section">
                <SideMenuButton to="/settings" icon={<Settings size={22} />} label="설정" />
            </div>
        </nav>
    );
};