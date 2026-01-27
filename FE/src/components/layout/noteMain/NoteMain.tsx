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
}

const NoteMain: React.FC<NoteMainProps> = ({
    title,
    onUpdateTitle,
    blocks,
    onUpdateBlock,
    onAddBlockAfter,
    onDeleteBlock,
    onFocusBlock
}) => {
    const renderBlock = (block: BlockData) => {
        switch (block.type) {
            case 'h1':
            case 'h2':
            case 'h3':
                return (
                    <HeadingBlock
                        key={block.id}
                        id={block.id}
                        level={block.type}
                        content={block.content}
                        onUpdate={onUpdateBlock}
                        onAddBlockBelow={onAddBlockAfter}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );

            case 'text':
                return (
                    <TextBlock
                        key={block.id}
                        id={block.id}
                        content={block.content}
                        onUpdate={onUpdateBlock}
                        onAddBlockBelow={onAddBlockAfter}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );

            case 'code':
                return (
                    <CodeBlock
                        key={block.id}
                        id={block.id}
                        language={block.language || 'javascript'}
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
                    className="note-main-title-input" // CSS 클래스 새로 정의 필요
                    value={title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    placeholder="제목 없음"
                />
            </header>

            <div className="note-content-area">
                {blocks.map(renderBlock)}
            </div>
        </div>
    );
};

export default NoteMain;