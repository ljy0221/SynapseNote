// src/pages/note/Note.tsx
import React, { useState } from 'react';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { NoteToolBar } from "../../components/layout/noteToolbar/NoteToolbar";
import './Note.css';

// 블록 데이터 타입 정의 (텍스트와 코드를 모두 수용)
export interface BlockData {
    id: number;
    type: 'text' | 'code'; // 블록의 종류 구분
    content: string;       // 텍스트 내용 또는 코드 내용
    language?: string;     // 코드 블록일 때만 사용
}

const Note: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    
    // 초기값: 빈 텍스트 블록 하나로 시작 (노션 감성)
    const [blocks, setBlocks] = useState<BlockData[]>([
        { id: Date.now(), type: 'text', content: '' }
    ]);

    // 코드 블록 추가 함수
    const addCodeBlock = () => {
        const newBlock: BlockData = {
            id: Date.now(),
            type: 'code',
            content: '', // 초기 코드는 비워둠
            language: 'javascript'
        };
        setBlocks([...blocks, newBlock]);
    };

    // 실시간 내용 업데이트 함수
    const updateBlock = (id: number, newCode: string) => {
        setBlocks(prev => prev.map(block => 
            block.id === id ? { ...block, content: newCode } : block
        ));
    };

    const deleteBlock = (id: number) => {
        if (window.confirm("이 블록을 삭제하시겠습니까?")) {
            setBlocks(prev => prev.filter(block => block.id !== id));
        }
    };

    return (
        <div className="page-content-container">
            {!isEditing ? (
                <div className="create-note-section">
                    <NoteButton onClick={() => setIsEditing(true)} />
                    <span className="create-note-label">새 노트 작성하기</span>
                </div>
            ) : (
                <div className="editing-layout-wrapper">
                    <NoteMain 
                        blocks={blocks} 
                        onDeleteBlock={deleteBlock} 
                        onUpdateBlock={updateBlock} 
                    />
                    <NoteToolBar isOpen={true} onAddBlock={addCodeBlock} /> 
                </div>
            )}
        </div>
    );
};

export default Note;