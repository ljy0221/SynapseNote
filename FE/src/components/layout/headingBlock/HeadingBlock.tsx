import React, { useState } from 'react';
import BlockTypeMenu from '../blockTypeMenu/BlockTypeMenu';
import { BlockType } from '../../../pages/note/Note';
import './HeadingBlock.css';

interface HeadingBlockProps {
    id: number;
    level: 'h1' | 'h2' | 'h3';
    content: string;
    onUpdate: (id: number, content: string) => void;
    onAddBlockBelow: (afterId: number, type: BlockType) => void;
    onFocus: () => void;
    onDelete: (id: number) => void;
    // DnD Props
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({
    id,
    level,
    content,
    onUpdate,
    onAddBlockBelow,
    onFocus,
    onDelete,
    draggable,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [text, setText] = useState(content);

    const handleBlur = () => {
        if (text !== content) {
            onUpdate(id, text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Enter 키를 누르면 아래에 새 텍스트 블록 추가
            onAddBlockBelow(id, 'text');
        }

        // Backspace 키: 내용이 비어있으면 블록 삭제
        if (e.key === 'Backspace' && text === '') {
            e.preventDefault();
            onDelete(id);
        }
    };

    return (
        <div
            className={`heading-block-wrapper ${level}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div
                className="block-controls"
                draggable={draggable}
                onDragStart={onDragStart}
                title="드래그하여 이동"
            >
                <button
                    className="add-block-btn"
                    onClick={() => setShowMenu(!showMenu)}
                    title="블록 추가"
                >
                    +
                </button>
                {/* 드래그 핸들 */}
                <div className="drag-handle-icon">
                    ⋮⋮
                </div>
                {showMenu && (
                    <BlockTypeMenu
                        onSelect={(type) => {
                            onAddBlockBelow(id, type);
                            setShowMenu(false);
                        }}
                        onClose={() => setShowMenu(false)}
                    />
                )}
            </div>
            <input
                type="text"
                className={`heading-input ${level}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                placeholder={
                    level === 'h1' ? '제목 1' :
                        level === 'h2' ? '제목 2' :
                            '제목 3'
                }
            />
        </div>
    );
};

export default HeadingBlock;