// FE/src/components/layout/noteMain/NoteMain.tsx
import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import { NoteToolBar } from '../noteToolbar/NoteToolbar';
import { BlockData, BlockType } from '../../../pages/note/Note';
import './NoteMain.css';
interface NoteMainProps {
    title: string;
    onUpdateTitle: (newTitle: string) => void;
    blocks: BlockData[];
    onUpdateBlock: (id: number, content: string) => void;
    onAddBlockAfter: (afterId: number, type: BlockType) => void;
    onAddBlockAtEnd: (type: BlockType) => void;  // 새로 추가
    onDeleteBlock: (id: number) => void;
    onFocusBlock: (id: number) => void;
    onMoveBlock: (dragIndex: number, hoverIndex: number) => void;
    titleInputRef?: React.RefObject<HTMLInputElement>;
}
const NoteMain: React.FC<NoteMainProps> = ({
    title,
    onUpdateTitle,
    blocks,
    onUpdateBlock,
    onAddBlockAfter,
    onAddBlockAtEnd,  // 새로 추가
    onDeleteBlock,
    onFocusBlock,
    onMoveBlock,
    titleInputRef
}) => {
    // DnD 상태 관리
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);
    const onDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        setDragIndex(index);
    };
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    const onDrop = (dropIndex: number) => {
        if (dragIndex === null || dragIndex === dropIndex) return;
        onMoveBlock(dragIndex, dropIndex);
        setDragIndex(null);
    };
    const renderBlock = (block: BlockData, index: number) => {
        const commonProps = {
            draggable: true,
            onDragStart: (e: React.DragEvent) => onDragStart(e, index),
            onDragOver: onDragOver,
            onDrop: () => onDrop(index),
        };
        switch (block.type) {
            case 'text':
                return (
                    <TextBlock
                        key={block.id}
                        {...commonProps}
                        id={block.id}
                        content={block.content}
                        onUpdate={onUpdateBlock}
                        onDelete={onDeleteBlock}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );
            case 'code':
                return (
                    <CodeBlock
                        key={block.id}
                        {...commonProps}
                        id={block.id}
                        language={(block.language as any) || 'javascript'}
                        code={block.content}
                        onDelete={onDeleteBlock}
                        onChange={onUpdateBlock}
                        onFocus={() => onFocusBlock(block.id)}
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
                    ref={titleInputRef}
                    className="note-main-title-input"
                    value={title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    placeholder="제목 없음"
                />
            </header>
            <div className="note-content-area">
                {blocks.map((block, index) => renderBlock(block, index))}
                {/* 마지막 블록 아래에 가로 툴바 */}
                <NoteToolBar onAddBlock={onAddBlockAtEnd} />
            </div>
        </div>
    );
};
export default NoteMain;