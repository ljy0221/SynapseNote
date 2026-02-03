import React from 'react';
import { Type, Code, Link, Users } from 'lucide-react';
import './NoteSideNav.css';

export type BlockType = 'text' | 'code';

interface NoteSideNavProps {
    onAddBlock: (type: BlockType) => void;
    onInvite: () => void;
    onPermission: () => void; // [New]
}

export const NoteSideNav: React.FC<NoteSideNavProps> = ({ onAddBlock, onInvite, onPermission }) => {
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
            </div>

            {/* Separator or new group could be added here, but user asked to add it to the bar */}
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
        </aside>
    );
};
