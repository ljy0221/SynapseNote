import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';// 경로 확인 필요
import { BlockData } from '../../../pages/note/Note';
import './NoteMain.css';

interface NoteMainProps {
    blocks: BlockData[];
    onDeleteBlock: (id: number) => void; // 이 라인을 추가하세요!
}

const NoteMain: React.FC<NoteMainProps> = ({ blocks, onDeleteBlock }) => {
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
                        id={block.id} // CodeBlock에도 id를 넘겨줘야 합니다.
                        language="javascript" 
                        code={block.code} 
                        onDelete={onDeleteBlock} // 삭제 함수도 전달
                    />
                ))}
            </div>
        </div>
    );
};

export default NoteMain;