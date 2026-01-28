import React, { useState } from 'react';
import { LayoutDashboard, FileText, Network, Sparkles, Settings, User } from 'lucide-react';
import { SideMenuButton } from '../../common/sideMenuButton/SideMenuButton';
import { UserProfileModal } from '../../common/modal/UserProfileModal';
import { useUser } from '../../../context/UserContext'; // 변경
import './SideMenuBar.css';

export const SideMenuBar: React.FC = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { userInfo, isLoading } = useUser(); // useUser 훅 사용

    // 로딩 처리나 에러 처리는 전역 컨텍스트에서 수행하므로 여기서는 userInfo만 사용
    // 필요 시 isLoading을 사용하여 로딩 스피너 등을 보여줄 수 있음

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
            {/* 데이터가 로드되지 않았을 때 모달을 열면 undefined가 전달될 수 있으므로 처리가 필요하지만
                일반적으로 UserProfileModal 내부에서 처리하거나, 데이터 로딩 전에는 버튼을 비활성화 할 수 있음.
                여기서는 그대로 전달. */}
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={userInfo || undefined} // null -> undefined 변환
            />
        </>
    );
};
