import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Network, Sparkles, Settings, User } from 'lucide-react';
import { SideMenuButton } from '../../common/sideMenuButton/SideMenuButton';
import { UserProfileModal } from '../../common/modal/UserProfileModal';
import { getUserInfo } from '../../../api/authApi';
import './SideMenuBar.css';

export const SideMenuBar: React.FC = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<{ name: string; email: string; imageUrl?: string } | undefined>(undefined);

    const fetchUserInfo = async () => {
        try {
            const info = await getUserInfo();
            setUserInfo({
                name: info.name,
                email: info.email,
                // imageUrl: info.profileImage // API에 profileImage가 없으므로 생략
            });
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (isProfileOpen) {
            fetchUserInfo();
        }
    }, [isProfileOpen]);

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
                user={userInfo}
            />
        </>
    );
};