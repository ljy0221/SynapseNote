// FE/src/components/layout/textBlock/TextBlock.tsx

import React, { useState, useRef, useEffect } from 'react';
import BlockTypeMenu from '../blockTypeMenu/BlockTypeMenu';
import { BlockType } from '../../../pages/note/Note';
import './TextBlock.css';

interface TextBlockProps {
    id: number;
    content: string;
    onUpdate: (id: number, content: string) => void;
    onAddBlockBelow: (afterId: number, type: BlockType) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ 
    id, 
    content, 
    onUpdate, 
    onAddBlockBelow 
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [text, setText] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 높이 자동 조절 함수
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    // 텍스트가 변경될 때마다 높이 조절
    useEffect(() => {
        adjustHeight();
    }, [text]);

    // 컴포넌트가 마운트될 때도 높이 조절
    useEffect(() => {
        adjustHeight();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleBlur = () => {
        if (text !== content) {
            onUpdate(id, text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            onAddBlockBelow(id, 'text');
        }
    };

    return (
        <div className="text-block-wrapper">
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
            <textarea
                ref={textareaRef}
                className="text-input"
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="텍스트를 입력하세요..."
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
            />
        </div>
    );
};

export default TextBlock;