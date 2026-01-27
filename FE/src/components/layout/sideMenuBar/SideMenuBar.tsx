import React, { useState } from 'react';
import { LayoutDashboard, FileText, Network, Sparkles, Settings, User } from 'lucide-react';
import { SideMenuButton } from '../../common/sideMenuButton/SideMenuButton';
import { UserProfileModal } from '../../common/modal/UserProfileModal';
import './SideMenuBar.css';

export const SideMenuBar: React.FC = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // TODO: 실제 유저 정보는 전역 상태(Context/Redux/Zustand)에서 가져와야 함
    const mockUser = {
        name: '사용자',
        email: 'user@example.com',
        // imageUrl: 'https://via.placeholder.com/150'
    };

    return (
        <>
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
                    {/* 내 정보: 페이지 이동 대신 모달 오픈 */}
                    <SideMenuButton
                        icon={<User size={22} />}
                        label="내 정보"
                        onClick={() => setIsProfileOpen(true)}
                    />
                    <SideMenuButton to="/settings" icon={<Settings size={22} />} label="설정" />
                </div>
            </nav>

            {/* 유저 프로필 모달 */}
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={mockUser}
            />
        </>
    );
};