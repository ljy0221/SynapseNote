import React from 'react';
import { Type, Code, Link, Users, Sparkles } from 'lucide-react';
import './NoteSideNav.css';

import { BlockType } from '../../../types/note/Block';
import { NoteMemberRole } from '../../../types/note/GetNoteMembers';

interface NoteSideNavProps {
    onAddBlock: (type: BlockType) => void;
    onInvite: () => void;
    onPermission: () => void;
    onSummary: () => void; // [New]
    role?: NoteMemberRole; // [New]
}

export const NoteSideNav: React.FC<NoteSideNavProps> = ({ onAddBlock, onInvite, onPermission, onSummary, role }) => {
    // [Fix] 권한 정보가 아직 없거나 VIEWER인 경우 사이드바 노출 안 함
    if (!role || role === 'VIEWER') return null;

    const isOwner = role === 'OWNER';

    return (
        <aside className="note-side-nav">
            <div className="nav-group">
                <button
                    className="nav-item"
                    onClick={() => onAddBlock('text')}
                    title="텍스트 블록 추가"
                >
                    <Type size={20} />
                    <span className="nav-label">텍스트</span>
                </button>
                <button
                    className="nav-item"
                    onClick={() => onAddBlock('code')}
                    title="코드 블록 추가"
                >
                    <Code size={20} />
                    <span className="nav-label">코드</span>
                </button>
                <button
                    className="nav-item"
                    onClick={onSummary}
                    title="AI 요약 생성"
                >
                    <Sparkles size={20} />
                    <span className="nav-label">AI 요약</span>
                </button>
            </div>

            {isOwner && (
                <div className="nav-group">
                    <button
                        className="nav-item"
                        onClick={onInvite}
                        title="초대 링크 복사"
                    >
                        <Link size={20} />
                        <span className="nav-label">초대</span>
                    </button>
                    <button
                        className="nav-item"
                        onClick={onPermission}
                        title="멤버 권한 관리"
                    >
                        <Users size={20} />
                        <span className="nav-label">권한</span>
                    </button>
                </div>
            )}
        </aside>
    );
};

