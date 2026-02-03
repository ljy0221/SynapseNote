import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { createNoteApi } from '../../api/notes/CreateNote.api';
import type { CreateNoteRequest } from '../../types/note/CreateNote';
import { useYjsStore } from '../../hooks/useYjsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNote } from '../../hooks/useNote'; // [New]
import './Note.css';

// 블록 타입 정의 (이원화: text / code)
export type BlockType = 'text' | 'code';

// 블록 데이터 타입 정의
export interface BlockData {
    id: number | string;
    type: BlockType;
    content: string;
    language?: string;  // code 타입일 때만 사용
}

const Note: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const [isEditing, setIsEditing] = useState(false);
    // Auth Store for User ID
    const { user } = useAuthStore();

    // Custom Hook for Note Logic
    const { note, role: currentUserRole, isLoading: isNoteLoading } = useNote(noteId);

    // Sync Title and Editing Mode when note loads
    useEffect(() => {
        if (note) {
            setTitle(note.title || "제목 없는 노트");
            setIsEditing(true);
        } else if (!noteId) {
            setIsEditing(false);
            setTitle("제목 없는 노트");
        }
    }, [note, noteId]);

    // Title Auto-save Debounce (ADDED)
    useEffect(() => {
        if (!noteId) return;

        const timer = setTimeout(async () => {
            // 변경된 제목 저장
            try {
                await updateNoteApi(noteId, { title });
                console.log("[Note] Title saved:", title);
            } catch (err) {
                console.error("[Note] Failed to save title:", err);
            }
        }, 1000); // 1초 디바운스

        return () => clearTimeout(timer);
    }, [title, noteId]);

    // 마지막에 블록 추가 (툴바용)
    const handleAddBlockAtEnd = (type: BlockType) => {
        addBlock(null, type);
    };

    const handleShortcutCreate = (type: BlockType) => {
        if (focusedBlockId !== null) {
            addBlock(focusedBlockId, type);
        } else {
            addBlock(null, type);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.nativeEvent.isComposing) return;

        if (e.altKey && (e.key === '1' || e.key === '2')) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === '1') handleShortcutCreate('text');
            if (e.key === '2') handleShortcutCreate('code');
            return;
        }

        if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
            if (focusedBlockId !== null && blocks.length > 0) {
                const selection = window.getSelection();
                if (selection && selection.anchorOffset !== 0) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
                if (currentIndex === -1) return;

                let nextFocusId: number | string | null = null;
                if (currentIndex > 0) {
                    nextFocusId = blocks[currentIndex - 1].id;
                } else if (blocks.length > 1) {
                    nextFocusId = blocks[currentIndex + 1].id;
                }

                deleteBlock(focusedBlockId);

                if (nextFocusId) {
                    setFocusedBlockId(nextFocusId);
                }
            }
        }
    };

    const handleMoveBlock = (dragIndex: number, hoverIndex: number) => {
        moveBlock(dragIndex, hoverIndex);
    };

    const handleCreateNote = async () => {
        try {
            const newNoteReq: CreateNoteRequest = {
                title: "제목 없는 노트",
                invitationUrl: "",
                directoryPath: "/",
            };
            const result = await createNoteApi(newNoteReq);
            console.log("노트 생성 성공:", result);

            // 사이드바 업데이트 트리거
            emitNotesChanged();

            if (result && result.noteId) {
                // 임시: 페이지 이동 (리로드 혹은 라우터 사용)
                window.location.href = `/notes/${result.noteId}`;
            } else {
                setIsEditing(true); // Fallback
            }

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

    if (isNoteLoading) {
        return <div className="page-content-container">Loading...</div>;
    }

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
                        noteId={noteId}
                        title={title}
                        onUpdateTitle={setTitle}
                        blocks={blocks}
                        onUpdateBlock={updateBlock}
                        onAddBlockAtEnd={handleAddBlockAtEnd}
                        onDeleteBlock={deleteBlock}
                        onFocusBlock={setFocusedBlockId}
                        focusedBlockId={focusedBlockId}
                        onMoveBlock={handleMoveBlock}
                        titleInputRef={titleInputRef}
                        onAddBlockAfter={(id, type) => addBlock(id, type)}
                        currentUserRole={currentUserRole} // [New]
                    />
                </div>
            )}
        </div>
    );
};

export default Note;
