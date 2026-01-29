/* src/components/layout/noteToolbar/NoteToolbar.tsx */
import React from 'react';
import { FileText, Code } from 'lucide-react';
import './NoteToolbar.css';
interface NoteToolBarProps {
    onAddBlock: (type: 'text' | 'code') => void;
}
export const NoteToolBar: React.FC<NoteToolBarProps> = ({ onAddBlock }) => {
    return (
        <div className="note-toolbar-horizontal">
            <button
                className="toolbar-add-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAddBlock('text')}
                title="텍스트 블록 추가"
            >
                <FileText size={20} />
            </button>
            <button
                className="toolbar-add-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAddBlock('code')}
                title="코드 블록 추가"
            >
                <Code size={20} />
            </button>
        </div>
    );
};