// src/components/layout/noteMain/NoteMain.tsx
import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import { BlockData } from '../../../pages/note/Note';
import './NoteMain.css';

interface NoteMainProps {
    blocks: BlockData[];
    onDeleteBlock: (id: number) => void;
    onUpdateBlock: (id: number, content: string) => void;
}

const NoteMain: React.FC<NoteMainProps> = ({ blocks, onDeleteBlock, onUpdateBlock }) => {
    return (
        <div className="note-main-layout">
            <header className="note-main-header">
                <div className="note-title-info"></div>
            </header>

            <div className="note-content-area">
                {blocks.map((block) => (
                    block.type === 'code' ? (
                        /* 코드 블록 렌더링 */
                        <CodeBlock 
                            key={block.id} 
                            id={block.id}
                            language={block.language || 'javascript'} 
                            code={block.content} 
                            onDelete={onDeleteBlock}
                            onChange={(val) => onUpdateBlock(block.id, val)}
                        />
                    ) : (
                        /* 텍스트(워드) 블록 렌더링 */
                        <div key={block.id} className="text-block-wrapper">
                            <textarea 
                                className="editable-text-area"
                                value={block.content}
                                onChange={(e) => {
                                    // 1. 상태 업데이트
                                    onUpdateBlock(block.id, e.target.value);
                                    
                                    // 2. 높이 자동 조절 로직
                                    e.target.style.height = 'auto'; // 초기화 후
                                    e.target.style.height = `${e.target.scrollHeight}px`; // 내용 높이만큼 설정
                                }}
                                placeholder="내용을 입력하세요..."
                                rows={1}
                            />
                            <button className="text-delete-btn" onClick={() => onDeleteBlock(block.id)}>×</button>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default NoteMain;