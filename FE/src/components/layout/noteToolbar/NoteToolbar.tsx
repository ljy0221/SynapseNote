/* src/components/layout/noteToolbar/NoteToolbar.tsx */
import React from 'react';
import {
    Type,
    Code,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import './NoteToolbar.css';
interface NoteToolBarProps {
    isOpen: boolean;
    onToggle: () => void;
    onButtonClick: (type: 'text' | 'code') => void;
}
export const NoteToolBar: React.FC<NoteToolBarProps> = ({
    isOpen,
    onToggle,
    onButtonClick
}) => {
    return (
        <aside className={`note-floating-toolbar ${isOpen ? 'open' : 'collapsed'}`}>
            {/* 토글 버튼 */}
            <button
                className="toolbar-toggle-btn"
                onClick={onToggle}
                title={isOpen ? "툴바 접기" : "툴바 열기"}
            >
                {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="toolbar-section">
                <button
                    className="toolbar-btn"
                    onClick={() => onButtonClick('text')}
                    title="일반 블록 추가"
                >
                    <Type size={20} />
                </button>
                <div className="divider" />
                <button
                    className="toolbar-btn"
                    onClick={() => onButtonClick('code')}
                    title="코드 블록 추가"
                >
                    <Code size={20} />
                </button>
            </div>
        </aside>
    );
};