// FE/src/components/layout/noteMain/NoteMain.tsx

import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import HeadingBlock from '../headingBlock/HeadingBlock';
import { BlockData, BlockType } from '../../../pages/note/Note';
import './NoteMain.css';

interface NoteMainProps {

    title: string;
    onUpdateTitle: (newTitle: string) => void;
    blocks: BlockData[];
    onUpdateBlock: (id: number, content: string) => void;
    onAddBlockAfter: (afterId: number, type: BlockType) => void;
    onDeleteBlock: (id: number) => void;
    onFocusBlock: (id: number) => void;
    onMoveBlock: (dragIndex: number, hoverIndex: number) => void;
}

const NoteMain: React.FC<NoteMainProps> = ({
    title,
    onUpdateTitle,
    blocks,
    onUpdateBlock,
    onAddBlockAfter,
    onDeleteBlock,
    onFocusBlock,
    onMoveBlock // [수정] Props에서 구조 분해 할당
}) => {

    // [추가] DnD 상태 관리
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);

    const onDragStart = (e: React.DragEvent, index: number) => {
        // [수정] 드래그 데이터 설정 (필수)
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        setDragIndex(index);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // 드롭 허용
    };

    const onDrop = (dropIndex: number) => {
        if (dragIndex === null || dragIndex === dropIndex) return;
        onMoveBlock(dragIndex, dropIndex);
        setDragIndex(null);
    };

    const renderBlock = (block: BlockData, index: number) => {
        // [추가] 공통 DnD Props 생성
        const commonProps = {
            draggable: true,
            onDragStart: (e: React.DragEvent) => onDragStart(e, index),
            onDragOver: onDragOver,
            onDrop: () => onDrop(index),
        };

        switch (block.type) {
            case 'h1':
            case 'h2':
            case 'h3':
                return (
                    <HeadingBlock
                        key={block.id}
                        {...commonProps} // [추가] Props 전달
                        id={block.id}
                        level={block.type}
                        content={block.content}
                        onUpdate={onUpdateBlock}
                        onAddBlockBelow={onAddBlockAfter}
                        onDelete={onDeleteBlock}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );

            case 'text':
                return (
                    <TextBlock
                        key={block.id}
                        {...commonProps} // [추가] Props 전달
                        id={block.id}
                        content={block.content}
                        onUpdate={onUpdateBlock}
                        onAddBlockBelow={onAddBlockAfter}
                        onDelete={onDeleteBlock}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );

            case 'code':
                return (
                    <CodeBlock
                        key={block.id}
                        {...commonProps} // [추가] Props 전달
                        id={block.id}
                        language={(block.language as any) || 'javascript'}
                        code={block.content}
                        onDelete={onDeleteBlock}
                        onChange={onUpdateBlock}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="note-main-layout">
            <header className="note-main-header">
                <input
                    className="note-main-title-input"
                    value={title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    placeholder="제목 없음"
                />
            </header>

            <div className="note-content-area">
                {/* [수정] index를 전달하도록 변경 */}
                {blocks.map((block, index) => renderBlock(block, index))}
            </div>
        </div>
    );
};

export default NoteMain;