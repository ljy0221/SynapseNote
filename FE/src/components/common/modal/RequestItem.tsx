import React, { useState } from 'react';
import { User, ChevronDown, Check, Ban } from 'lucide-react';
import { NoteMemberRole } from '../../../types/note/GetNoteMembers';

interface RequestItemProps {
    req: {
        id: string;
        nickname: string;
        email: string;
    };
    onAccept: (requestId: string, role: NoteMemberRole) => void;
    onReject: (requestId: string) => void;
}

export const RequestItem: React.FC<RequestItemProps> = ({ req, onAccept, onReject }) => {
    const [selectedRole, setSelectedRole] = useState<NoteMemberRole>('VIEWER');

    return (
        <div className="request-item">
            <div className="member-info">
                <div className="member-avatar request">
                    <User size={20} />
                </div>
                <div className="member-details">
                    <span className="member-nickname">{req.nickname}</span>
                    <span className="member-email">{req.email}</span>
                </div>
            </div>

            <div className="request-actions">
                <div className="role-select-wrapper small">
                    <select
                        className="role-select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as NoteMemberRole)}
                    >
                        <option value="EDITOR">편집자</option>
                        <option value="VIEWER">뷰어</option>
                    </select>
                    <ChevronDown size={14} className="role-select-icon" />
                </div>

                <button
                    className="action-btn accept"
                    onClick={() => onAccept(req.id, selectedRole)}
                    title="수락"
                >
                    <Check size={16} />
                </button>
                <button
                    className="action-btn reject"
                    onClick={() => onReject(req.id)}
                    title="거절"
                >
                    <Ban size={16} />
                </button>
            </div>
        </div>
    );
};
