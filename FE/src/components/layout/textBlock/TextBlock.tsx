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
    onFocus: () => void;
    onDelete: (id: number) => void;
    // DnD Props
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({
    id,
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ... (높이 조절 코드 등 중간 로직은 그대로 유지) ...
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
        // Shift + Enter: 아래에 새 텍스트 블록 생성
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
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
            className="text-block-wrapper"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* [수정] 드래그 이벤트를 이 컨트롤 박스 전체에 적용합니다! */}
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

                {/* [수정] 아래 div는 이제 기능 없이 아이콘만 보여주는 역할입니다 (className 변경 추천) */}
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

            <textarea
                ref={textareaRef}
                className="text-input"
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                placeholder="텍스트를 입력하세요..."
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
            />
        </div>
    );
};

export default TextBlock;