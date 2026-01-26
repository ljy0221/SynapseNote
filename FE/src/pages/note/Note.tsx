import React, { useState } from 'react';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { NoteToolBar } from "../../components/layout/noteToolbar/NoteToolbar";
import './Note.css';

// 블록 데이터 타입 정의
export interface BlockData {
    id: number;
    code: string;
}

const Note: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    
    // 1. 블록 배열 상태 관리
    const [blocks, setBlocks] = useState<BlockData[]>([
        { id: Date.now(), code: 'function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}' }
    ]);

    // 2. 블록 추가 함수
    const addBlock = () => {
        const newBlock: BlockData = {
            id: Date.now(),
            code: '// 새로운 코드를 작성하세요.'
        };
        setBlocks([...blocks, newBlock]);
    };

    return (
        <div className="page-content-container">
            {!isEditing ? (
                <>
                    <h2>노트 편집 페이지</h2>
                    <div className="create-note-section">
                        <NoteButton onClick={() => setIsEditing(true)} />
                        <span className="create-note-label">새 노트 작성하기</span>
                    </div>
                </>
            ) : (
                <div className="editing-layout-wrapper">
                    {/* 3. props 전달 */}
                    <NoteMain blocks={blocks} />
                    <NoteToolBar isOpen={true} onAddBlock={addBlock} /> 
                </div>
            )}
        </div>
    );
};

export default Note;