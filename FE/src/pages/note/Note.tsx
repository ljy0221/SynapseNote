import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import NoteButton from "../../components/common/noteButton/NoteButton";
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { createNote } from '../../utils/noteAPI';
import { getNoteDetailApi } from '../../api/notes/GetNoteDetail.api';
import { getBlocksApi } from '../../api/notes/GetBlocks.api';
import type { CreateNoteRequest } from '../../types/note/CreateNote';
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
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("제목 없는 노트");
    const [focusedBlockId, setFocusedBlockId] = useState<number | string | null>(null);

    // 제목 input ref
    const titleInputRef = useRef<HTMLInputElement>(null);

    // 블록 배열 상태 관리
    const [blocks, setBlocks] = useState<BlockData[]>([]);

    const fetchNoteData = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const [noteRes, blocksRes] = await Promise.all([
                getNoteDetailApi(id),
                getBlocksApi(id)
            ]);

            console.log("[Note] Fetched Note Detail:", noteRes);
            console.log("[Note] Fetched Blocks:", blocksRes);

            if (noteRes) {
                setTitle(noteRes.title || "제목 없는 노트");
            }

            if (blocksRes) {
                const adaptedBlocks: BlockData[] = blocksRes.map((b: any) => {
                    let content = '';
                    let language = b.language;

                    if (b.type === 'text') {
                        content = b.properties?.content || '';
                    } else if (b.type === 'code') {
                        content = b.properties?.code || '';
                        language = b.properties?.language || 'javascript';
                    }

                    return {
                        id: b.blockId,
                        type: b.type,
                        content: content,
                        language: language
                    };
                });

                if (adaptedBlocks.length === 0) {
                    setBlocks([{ id: Date.now(), type: 'text', content: '' }]);
                } else {
                    setBlocks(adaptedBlocks);
                }
            }
            setIsEditing(true);
        } catch (error) {
            console.error("노트 데이터 로딩 실패:", error);
            alert("노트 데이터를 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (noteId) {
            fetchNoteData(noteId);
        } else {
            setIsEditing(false);
            setBlocks([{ id: Date.now(), type: 'text', content: '' }]);
            setTitle("제목 없는 노트");
        }
    }, [noteId, fetchNoteData]);

    // 특정 블록 뒤에 새 블록 추가 (+ 버튼용)
    const addBlockAfter = (afterId: number | string, type: BlockType) => {
        const defaultContent = type === 'code' ? '// 코드를 작성하세요.' : '';
        const newBlock: BlockData = {
            id: Date.now(), // 클라이언트 사이드에서는 여전히 Number로 임시 ID 생성 (DB 저장 전)
            type: type,
            content: defaultContent,
            language: type === 'code' ? 'javascript' : undefined,
        };
        const index = blocks.findIndex(b => b.id === afterId);
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);

        setBlocks(newBlocks);
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
        }
    };

    const handleShortcutCreate = (type: BlockType) => {
        if (focusedBlockId !== null) {
            addBlockAfter(focusedBlockId, type);
        } else {
            handleAddBlockAtEnd(type);
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
            if (focusedBlockId !== null && blocks.length > 1) {
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

                setBlocks(prevBlocks => prevBlocks.filter(b => b.id !== focusedBlockId));

                if (nextFocusId) {
                    setFocusedBlockId(nextFocusId);
                }
            }
        }
    };

    const updateBlock = (id: number | string, content: string) => {
        setBlocks(blocks.map(block =>
            block.id === id ? { ...block, content } : block
        ));
    };

    const deleteBlock = (id: number | string) => {
        if (blocks.length > 1) {
            setBlocks(blocks.filter(block => block.id !== id));
        }
    };

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
                invitationUrl: "",
                directoryPath: "/",
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

    if (isLoading) {
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
                        title={title}
                        onUpdateTitle={setTitle}
                        blocks={blocks}
                        onUpdateBlock={updateBlock}
                        onAddBlockAfter={addBlockAfter}
                        onAddBlockAtEnd={handleAddBlockAtEnd}
                        onDeleteBlock={deleteBlock}
                        onFocusBlock={setFocusedBlockId}
                        focusedBlockId={focusedBlockId}
                        onMoveBlock={handleMoveBlock}
                        titleInputRef={titleInputRef}
                    />
                </div>
            )}
        </div>
    );
};

export default Note;
