// FE/src/pages/note/Note.tsx
import React, { useState, useRef } from 'react';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { NoteToolBar } from "../../components/layout/noteToolbar/NoteToolbar";
import { createNote } from '../../utils/noteAPI';
import type { CreateNoteRequest } from '../../types/note/createNote';
import './Note.css';
// 블록 타입 정의 (이원화: text / code)
export type BlockType = 'text' | 'code';
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
    const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);
    // 제목 input ref
    const titleInputRef = useRef<HTMLInputElement>(null);
    // 블록 배열 상태 관리 (초기에는 빈 텍스트 블록 하나)
    const [blocks, setBlocks] = useState<BlockData[]>([
        { id: Date.now(), type: 'text', content: '' }
    ]);
    // 블록 추가 함수 (툴바용) - 맨 아래에 추가
    const handleAddBlock = (type: BlockType) => {
        const newBlock: BlockData = {
            id: Date.now(),
            type: type,
            content: type === 'code' ? '// 코드를 작성하세요.' : '',
            language: type === 'code' ? 'javascript' : undefined,
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
    // 블록 순서 변경 (DnD)
    const handleMoveBlock = (dragIndex: number, hoverIndex: number) => {
        const dragBlock = blocks[dragIndex];
        const newBlocks = [...blocks];
        newBlocks.splice(dragIndex, 1);
        newBlocks.splice(hoverIndex, 0, dragBlock);
        setBlocks(newBlocks);
    };
    // 툴바 열림/닫힘 상태
    const [isToolbarOpen, setIsToolbarOpen] = useState(true);
    // 툴바 버튼 클릭 핸들러: 새 블록 추가
    const handleToolbarAction = (type: BlockType) => {
        handleAddBlock(type);
    };
    const handleCreateNote = async () => {
        try {
            const newNoteReq: CreateNoteRequest = {
                title: "제목 없는 노트",
                directoryPath: "/",
                pointX: null,
                pointY: null,
                content: "",
            };
            const result = await createNote(newNoteReq);
            console.log("노트 생성 성공:", result);
            setIsEditing(true);
            setTimeout(() => {
                if (titleInputRef.current) {
                    titleInputRef.current.focus();
                    titleInputRef.current.select();
                }
            }, 100);
        } catch (error) {
            console.error("노트 생성 중 에러 발생:", error);
            alert("노트를 생성하지 못했습니다.");
        }
    };
    return (
        <div className="page-content-container">
            {!isEditing ? (
                <>
                    <div className="note-intro-wrapper">
                        <h2>노트 편집 페이지</h2>
                        <div className="create-note-section">
                            <NoteButton onClick={handleCreateNote} />
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
                        onFocusBlock={setFocusedBlockId}
                        onMoveBlock={handleMoveBlock}
                        titleInputRef={titleInputRef}
                    />
                    <NoteToolBar
                        isOpen={isToolbarOpen}
                        onToggle={() => setIsToolbarOpen(!isToolbarOpen)}
                        onButtonClick={handleToolbarAction}
                    />
                </div>
            )}
        </div>
    );
};
export default Note;