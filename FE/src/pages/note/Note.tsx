// FE/src/pages/note/Note.tsx

import React, { useState, useRef } from 'react';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { NoteToolBar } from "../../components/layout/noteToolbar/NoteToolbar";
import { createNote } from '../../utils/noteAPI';
import type { CreateNoteRequest } from '../../types/note/createNote';
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

    const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);

    // [추가] 제목 input ref - 노트 생성 후 자동 포커스용
    const titleInputRef = useRef<HTMLInputElement>(null);

    // 블록 배열 상태 관리 (초기에는 빈 텍스트 블록 하나)
    const [blocks, setBlocks] = useState<BlockData[]>([
        { id: Date.now(), type: 'text', content: '' }
    ]);

    // [변경] 블록 추가 함수 (툴바용) - 맨 아래에 추가
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

    // 2. 타입 변경 함수 추가
    const handleChangeBlockType = (type: BlockType) => {
        if (!focusedBlockId) return; // 선택된 게 없으면 무시

        setBlocks(blocks.map(block =>
            block.id === focusedBlockId
                ? { ...block, type: type } // 타입 교체!
                : block
        ));
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

    // [추가] 블록 순서 변경 (DnD)
    const handleMoveBlock = (dragIndex: number, hoverIndex: number) => {
        const dragBlock = blocks[dragIndex];
        const newBlocks = [...blocks];
        newBlocks.splice(dragIndex, 1);
        newBlocks.splice(hoverIndex, 0, dragBlock);
        setBlocks(newBlocks);
    };





    // 툴바 열림/닫힘 상태
    const [isToolbarOpen, setIsToolbarOpen] = useState(true);

    // 툴바 버튼 클릭 핸들러: 포커스된 블록이 있으면 타입 변경, 없으면 새 블록 추가
    const handleToolbarAction = (type: BlockType) => {
        if (focusedBlockId) {
            handleChangeBlockType(type);
        } else {
            handleAddBlock(type);
        }
    };

    const handleCreateNote = async () => {
        try {
            // 1. 요청 데이터 준비
            const newNoteReq: CreateNoteRequest = {
                title: "제목 없는 노트", // 초기 제목
                directoryPath: "/",      // 기본 경로 (필요 시 수정)
                pointX: null,
                pointY: null,
                content: "",             // 초기 내용
            };
            // 2. API 호출
            const result = await createNote(newNoteReq);
            console.log("노트 생성 성공:", result);
            // 3. 성공 시 상태 업데이트
            // result에 담긴 noteId 등을 활용해 상태를 설정할 수도 있습니다.
            // 예: setCurrentNoteId(result.noteId);

            setIsEditing(true); // 편집 모드 전환

            // [추가] 노트 생성 후 제목 입력 필드에 자동 포커스 + 전체 선택
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
                        titleInputRef={titleInputRef}  // [추가] 제목 input ref 전달
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