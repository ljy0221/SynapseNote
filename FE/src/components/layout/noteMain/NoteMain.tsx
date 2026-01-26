// FE/src/components/layout/noteMain/NoteMain.tsx

import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import HeadingBlock from '../headingBlock/HeadingBlock';
import { BlockData, BlockType } from '../../../pages/note/Note';
import './NoteMain.css';

interface NoteMainProps {
    blocks: BlockData[];
    onUpdateBlock: (id: number, content: string) => void;
    onAddBlockAfter: (afterId: number, type: BlockType) => void;
    onDeleteBlock: (id: number) => void;
}

const NoteMain: React.FC<NoteMainProps> = ({ 
    blocks, 
    onUpdateBlock, 
    onAddBlockAfter, 
    onDeleteBlock 
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
                    />
                );
            
            case 'code':
                return (
                    <CodeBlock 
                        key={block.id}
                        language={block.language || 'javascript'}
                        code={block.content}
                    />
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="note-main-layout">
            <header className="note-main-header">
                <div className="note-title-info"></div>
            </header>

            <div className="note-content-area">
                {blocks.map(renderBlock)}
            </div>
        </div>
    );
};

export default NoteMain;