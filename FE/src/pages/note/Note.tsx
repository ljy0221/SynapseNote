// FE/src/pages/note/Note.tsx

import React, { useState } from 'react';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { NoteToolBar } from "../../components/layout/noteToolbar/NoteToolbar";
import './Note.css';

// 블록 타입 정의
export type BlockType = 'h1' | 'h2' | 'h3' | 'text' | 'code';

// 블록 데이터 타입 정의
export interface BlockData {
    id: number;
    type: BlockType;
    content: string;
    language?: string;  // code 타입일 때만 사용
}

const Note: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);

    const [title, setTitle] = useState("제목 없는 노트");

    // 블록 배열 상태 관리 (초기에는 빈 텍스트 블록 하나)
    const [blocks, setBlocks] = useState<BlockData[]>([
        { id: Date.now(), type: 'text', content: '' }
    ]);

    // 코드블록 추가 (Add Block 버튼용 - 맨 끝에 추가)
    const addCodeBlock = () => {
        const newBlock: BlockData = {
            id: Date.now(),
            type: 'code',
            content: '// 새로운 코드를 작성하세요.',
            language: 'javascript'
        };
        setBlocks([...blocks, newBlock]);
    };

    // 특정 블록 뒤에 새 블록 추가 (+ 버튼용)
    const addBlockAfter = (afterId: number, type: BlockType) => {
        const defaultContent = type === 'code' ? '// 코드를 작성하세요.' : '';

        const newBlock: BlockData = {
            id: Date.now(),
            type: type,
            content: defaultContent,
            language: type === 'code' ? 'javascript' : undefined,
        };

        const index = blocks.findIndex(b => b.id === afterId);
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
    };

    // 블록 내용 업데이트
    const updateBlock = (id: number, content: string) => {
        setBlocks(blocks.map(block =>
            block.id === id ? { ...block, content } : block
        ));
    };

    // 블록 삭제
    const deleteBlock = (id: number) => {
        if (blocks.length > 1) {
            setBlocks(blocks.filter(block => block.id !== id));
        }
    };

    return (
        <div className="page-content-container">
            {!isEditing ? (
                <>
                    <div className="note-intro-wrapper">
                        <h2>노트 편집 페이지</h2>
                        <div className="create-note-section">
                            <NoteButton onClick={() => setIsEditing(true)} />
                            <span className="create-note-label">새 노트 작성하기</span>
                        </div>
                    </div>

                </>
            ) : (
                <div className="editing-layout-wrapper">
                    <NoteMain
                        title={title}
                        onUpdateTitle={setTitle}
                        blocks={blocks}
                        onUpdateBlock={updateBlock}
                        onAddBlockAfter={addBlockAfter}
                        onDeleteBlock={deleteBlock}
                    />
                    <NoteToolBar
                        isOpen={true}
                        onAddBlock={addCodeBlock}
                    />
                </div>
            )}
        </div>
    );
};

export default Note;