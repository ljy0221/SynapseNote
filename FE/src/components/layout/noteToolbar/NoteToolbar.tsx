/* src/components/layout/noteToolbar/NoteToolbar.tsx */
import React from 'react';
import {
    Heading1,
    Heading2,
    Heading3,
    Type,
    Code,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import './NoteToolbar.css';

interface NoteToolBarProps {
    isOpen: boolean;
    onToggle: () => void;
    onAddBlock: (type: any) => void;
}

export const NoteToolBar: React.FC<NoteToolBarProps> = ({
    isOpen,
    onToggle,
    onAddBlock
}) => {
    return (
        <aside className={`note-floating-toolbar ${isOpen ? 'open' : 'collapsed'}`}>
            {/* 토글 버튼 (툴바 경계선에 걸치게 배치) */}
            <button
                className="toolbar-toggle-btn"
                onClick={onToggle}
                title={isOpen ? "툴바 접기" : "툴바 열기"}
            >
                {/* 열와 있으면 닫는 화살표, 닫혀 있으면 여는 화살표 (오른쪽 바 기준) */}
                {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="toolbar-section">
                <button className="toolbar-btn" onClick={() => onAddBlock('h1')} title="제목 1">
                    <Heading1 size={20} />
                </button>

                <button className="toolbar-btn" onClick={() => onAddBlock('h2')} title="제목 2">
                    <Heading2 size={20} />
                </button>

                <button className="toolbar-btn" onClick={() => onAddBlock('h3')} title="제목 3">
                    <Heading3 size={20} />
                </button>

                <div className="divider" />

                <button className="toolbar-btn" onClick={() => onAddBlock('text')} title="텍스트">
                    <Type size={20} />
                </button>

                <button className="toolbar-btn" onClick={() => onAddBlock('code')} title="코드 블록 추가">
                    <Code size={20} />
                </button>
            </div>
        </aside>
    );
};