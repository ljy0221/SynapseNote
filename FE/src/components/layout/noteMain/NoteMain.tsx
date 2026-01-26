import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';// 경로 확인 필요
import { BlockData } from '../../../pages/note/Note';
import './NoteMain.css';

interface NoteMainProps {
    blocks: BlockData[];
}

const NoteMain: React.FC<NoteMainProps> = ({ blocks }) => {
    return (
        <div className="note-main-layout">
            <header className="note-main-header">
                <div className="note-title-info"></div>
            </header>

            <div className="note-content-area">
                {/* 4. 배열 순회하며 블록 출력 */}
                {blocks.map((block) => (
                    <CodeBlock 
                        key={block.id} 
                        language="javascript" 
                        code={block.code} 
                    />
                ))}
            </div>
        </div>
    );
};

export default NoteMain;