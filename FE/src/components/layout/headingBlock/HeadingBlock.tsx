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
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ 
    id, 
    level, 
    content, 
    onUpdate, 
    onAddBlockBelow 
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
    };

    return (
        <div className={`heading-block-wrapper ${level}`}>
            <div className="block-controls">
                <button 
                    className="add-block-btn" 
                    onClick={() => setShowMenu(!showMenu)}
                    title="블록 추가"
                >
                    +
                </button>
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