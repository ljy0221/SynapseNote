/* src/components/layout/noteToolbar/NoteToolbar.tsx */
import React from 'react';
import { FileText, Code } from 'lucide-react';
import './NoteToolbar.css';

interface NoteToolBarProps {
    // 블록 타입을 인자로 받아 부모 컴포넌트(NoteMain)에 전달
    onAddBlock: (type: 'text' | 'code') => void;
}

export const NoteToolBar: React.FC<NoteToolBarProps> = ({ onAddBlock }) => {
    return (
        <div className="note-toolbar-horizontal">
            {/* 텍스트 블록 추가 버튼 */}
            <button
                className="toolbar-add-btn"
                onMouseDown={(e) => e.preventDefault()} // 포커스 뺏김 방지
                onClick={() => onAddBlock('text')}
                title="텍스트 블록 추가"
            >
                <FileText size={20} />
                <span>Text</span>
            </button>

            {/* 코드 블록 추가 버튼 */}
            <button
                className="toolbar-add-btn"
                onMouseDown={(e) => e.preventDefault()} // 포커스 뺏김 방지
                onClick={() => onAddBlock('code')}
                title="코드 블록 추가"
            >
                <Code size={20} />
                <span>Code</span>
            </button>
        </div>
    );
};