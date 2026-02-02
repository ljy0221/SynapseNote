import React, { useState, useRef } from 'react';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { createNote } from '../../utils/noteAPI';
import type { CreateNoteRequest } from '../../types/note/CreateNote';
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

        // 블록 추가
        setBlocks(newBlocks);

        // (선택사항) UX 향상: 새로 생성된 블록으로 포커스를 이동하려면 아래 주석 해제
        // setFocusedBlockId(newBlock.id); 
    };

    // 마지막에 블록 추가하는 함수 (하단 툴바용)
    const handleAddBlockAtEnd = (type: BlockType) => {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock) {
            addBlockAfter(lastBlock.id, type);
        } else {
            const newBlock: BlockData = {
                id: Date.now(),
                type: type,
                content: type === 'code' ? '// 코드를 작성하세요.' : '',
                language: type === 'code' ? 'javascript' : undefined,
            };
            setBlocks([newBlock]);
            // (선택사항) UX 향상
            // setFocusedBlockId(newBlock.id);
        }
    };

    // -------------------------------------------------------------
    // [추가] 단축키 핸들러 로직 (제언)
    // -------------------------------------------------------------
    const handleShortcutCreate = (type: BlockType) => {
        if (focusedBlockId !== null) {
            // 포커스 된 블록이 있다면 그 바로 뒤에 추가
            addBlockAfter(focusedBlockId, type);
        } else {
            // 포커스 된 블록이 없다면 맨 마지막에 추가
            handleAddBlockAtEnd(type);
        }
    };

    // [변경] useEffect 제거 및 컴포넌트 핸들러로 변경
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.nativeEvent.isComposing) return;

        // [기존] 블록 생성 단축키 (Alt + 1, Alt + 2)
        if (e.altKey && (e.key === '1' || e.key === '2')) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === '1') handleShortcutCreate('text');
            if (e.key === '2') handleShortcutCreate('code');
            return;
        }

        // ---------------------------------------------------------
        // [개선됨] 블록 삭제 단축키: Shift + Delete (또는 Backspace)
        // ---------------------------------------------------------
        if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
            // 포커스된 블록이 있고, 블록이 2개 이상일 때만 삭제 허용
            if (focusedBlockId !== null && blocks.length > 1) {

                // [추가] 텍스트 입력 중인지 확인 (커서가 0이 아니면 삭제 취소)
                const selection = window.getSelection();
                if (selection && selection.anchorOffset !== 0) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                // 1. 삭제 대상 인덱스 찾기
                const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
                if (currentIndex === -1) return;

                // 2. 포커스 이동할 대상 찾기 (이전 블록 우선, 없으면 다음 블록)
                let nextFocusId: number | null = null;
                if (currentIndex > 0) {
                    nextFocusId = blocks[currentIndex - 1].id;
                } else if (blocks.length > 1) {
                    nextFocusId = blocks[currentIndex + 1].id;
                }

                // 3. 블록 삭제
                setBlocks(prevBlocks => prevBlocks.filter(b => b.id !== focusedBlockId));

                // 4. 포커스 이동
                if (nextFocusId) {
                    setFocusedBlockId(nextFocusId);
                }
            }
        }
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
                <div
                    className="editing-layout-wrapper"
                    tabIndex={-1}
                    onKeyDown={handleKeyDown}
                    style={{ outline: 'none' }}
                >
                    <NoteMain
                        title={title}
                        onUpdateTitle={setTitle}
                        blocks={blocks}
                        onUpdateBlock={updateBlock}
                        onAddBlockAfter={addBlockAfter}
                        onAddBlockAtEnd={handleAddBlockAtEnd}
                        onDeleteBlock={deleteBlock}
                        onFocusBlock={setFocusedBlockId}
                        focusedBlockId={focusedBlockId} // [추가] 포커스 ID 전달
                        onMoveBlock={handleMoveBlock}
                        titleInputRef={titleInputRef}
                    />
                </div>
            )}
        </div>
    );
};

export default Note;