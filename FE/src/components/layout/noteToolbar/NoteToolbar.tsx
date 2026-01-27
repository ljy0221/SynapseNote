import React from 'react';
import BlockAddButton from '../../common/blockAddButton/BlockAddButton';
import './NoteToolbar.css';

interface NoteToolBarProps {
    isOpen: boolean;
    onAddBlock: () => void; // 함수 타입 추가
}

export const NoteToolBar: React.FC<NoteToolBarProps> = ({ isOpen, onAddBlock }) => {
    return (
        <aside className={`note-toolbar ${isOpen ? 'open' : ''}`}>
            <div className="toolbar-content">
                <p className="toolbar-section-title">COMPONENTS</p>
                <ul className="component-list">
                    <li>H1 Heading</li>
                    <li>H2 Subheading</li>
                    <li>Code Block</li>
                </ul>

                {/* 5. 부모의 추가 함수 실행 */}
                <BlockAddButton onClick={onAddBlock} />
            </div>
        </aside>
    );
};