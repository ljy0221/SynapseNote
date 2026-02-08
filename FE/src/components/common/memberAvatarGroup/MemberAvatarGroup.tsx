import React from 'react';
import './MemberAvatarGroup.css';
import { NoteMemberItem } from '../../../types/note/GetNoteMembers';
import { Tooltip } from '../tooltip/Tooltip';

interface MemberAvatarGroupProps {
    members: NoteMemberItem[];
    max?: number;
    size?: number;
}

export const MemberAvatarGroup: React.FC<MemberAvatarGroupProps> = ({
    members,
    max = 5,
    size = 28
}) => {
    // [New] Initials Helper
    const getInitials = (name?: string) => {
        if (!name) return '?';
        const cleanName = name.trim();
        if (cleanName.length === 0) return '?';
        // 영어인 경우 첫 글자, 한글인 경우 첫 글자
        return cleanName.charAt(0).toUpperCase();
    };

    // [New] Color Generator based on name
    const getColor = (name: string) => {
        const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };
    const displayMembers = members.slice(0, max);
    const overflowCount = members.length - max;

    return (
        <div className="member-avatar-group">
            {displayMembers.map((member) => {
                const displayName = member.name || member.memberName || member.email;
                const initials = getInitials(displayName);
                const bgColor = getColor(displayName);

                return (
                    <Tooltip
                        key={member.memberId || member.email}
                        title={displayName}
                        content={`${member.role || 'VIEWER'}`} // [New] Show Role
                        placement="bottom"
                    >
                        <div
                            className="member-avatar-item"
                            style={{ width: size, height: size }}
                        >
                            {member.profileImageUrl ? (
                                <img
                                    src={member.profileImageUrl}
                                    alt={displayName}
                                    className="member-avatar-img"
                                />
                            ) : (
                                <div
                                    className="member-avatar-placeholder initials"
                                    style={{ backgroundColor: bgColor, color: '#fff' }}
                                >
                                    {initials}
                                </div>
                            )}
                            {/* {member.isOnline && <div className="member-status-dot online" />} */}
                        </div>
                    </Tooltip>
                );
            })}

            {overflowCount > 0 && (
                <div
                    className="member-avatar-overflow"
                    style={{ width: size, height: size, fontSize: size * 0.4 }}
                >
                    +{overflowCount}
                </div>
            )}
        </div>
    );
};
