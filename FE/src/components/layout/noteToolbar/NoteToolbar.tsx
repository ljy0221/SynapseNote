// src/components/layout/noteToolbar/NoteToolbar.tsx
import React from 'react';
import BlockAddButton from '../../common/blockAddButton/BlockAddButton';
import './NoteToolbar.css';

interface NoteToolBarProps {
    isOpen: boolean;
}

export const NoteToolBar: React.FC<NoteToolBarProps> = ({ isOpen }) => {
    const handleAddBlock = () => {
        // 실제 블록 추가 로직이 들어갈 자리입니다.
        console.log("새 블록이 추가되었습니다.");
    };

    return (
        <aside className={`note-toolbar ${isOpen ? 'open' : ''}`}>
            <div className="toolbar-content">
                <p className="toolbar-section-title">COMPONENTS</p>
                
                {/* 기존 리스트 영역 (h1, h2, h3 등) */}
                <ul className="component-list">
                    <li>H1 Heading</li>
                    <li>H2 Subheading</li>
                    <li>Code Block</li>
                </ul>

                {/* 새로 만든 공통 버튼 배치 */}
                <BlockAddButton onClick={handleAddBlock} />
            </div>
        </aside>
    );
};