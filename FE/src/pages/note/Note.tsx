import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookPen } from 'lucide-react';
import { useParams } from 'react-router-dom';
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { getNoteDetailApi } from '../../api/notes/GetNoteDetail.api';
import { updateNoteApi } from '../../api/notes/UpdateNote.api'; // ADDED
import { summarizeNoteApi } from '../../api/ai/NoteSummary.api';
import { emitNotesChanged } from '../../events/NotesEvents'; // ADDED
import type { SummaryStyle } from '../../types/ai/NoteSummary';
import { useYjsStore } from '../../hooks/useYjsStore';
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

    // AI 요약 관련 state
    const [summary, setSummary] = useState<string | undefined>(undefined);
    const [summaryStyle, setSummaryStyle] = useState<string | undefined>(undefined);
    const [summaryUpdatedAt, setSummaryUpdatedAt] = useState<string | undefined>(undefined);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    // 제목 input ref
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Yjs Store 사용
    const { blocks, isSynced, addBlock, updateBlock, deleteBlock, moveBlock } = useYjsStore(noteId);

    const fetchNoteDetail = useCallback(async (id: string) => {
    try {
        const noteRes = await getNoteDetailApi(id);
        console.log("[Note] Fetched Note Detail:", noteRes);

        if (noteRes) {
            setTitle(noteRes.title || "제목 없는 노트");
            setSummary(noteRes.summary);
            setSummaryStyle(noteRes.summaryStyle);
            setSummaryUpdatedAt(noteRes.summaryUpdatedAt);

            // 중요: Yjs 스토어가 비어있고 API 결과에 블록이 있다면 초기화 시도
            // 단, 이미 동기화된 데이터가 있다면 덮어쓰지 않도록 주의가 필요합니다.
            if (isSynced && blocks.length === 0 && noteRes.blocks && noteRes.blocks.length > 0) {
                noteRes.blocks.forEach((block: any) => {
                    // 기존 addBlock을 활용하여 Yjs에 초기 데이터 주입
                    // block.type과 content가 API 응답 구조에 맞는지 확인 필요
                    addBlock(null, block.type, block.content);
                });
            }
        }
        setIsEditing(true);
        } catch (error) {
            console.error("노트 상세 정보 로딩 실패:", error);
        }
    }, [isSynced, blocks.length, addBlock]);

    useEffect(() => {
        if (noteId) {
            fetchNoteDetail(noteId);
        } else {
            setIsEditing(false);
            setTitle("제목 없는 노트");
        }
    }, [noteId, fetchNoteDetail]);

    // Title Auto-save Debounce (ADDED)
    useEffect(() => {
        if (!noteId) return;

        const timer = setTimeout(async () => {
            try {
                await updateNoteApi(noteId, { title });

                // Sidebar 즉시 반영 트리거
                emitNotesChanged({
                    type: 'UPDATE_TITLE',
                    noteId,
                    title,
                });
                // 또는 아래 방식 (더 좋음, 아래 설명)
            } catch (err) {
                console.error('[Note] Failed to save title:', err);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [title, noteId]);


    // 마지막에 블록 추가 (툴바용)
    const handleAddBlockAtEnd = (type: BlockType) => {
        addBlock(null, type, '');
    };

    const handleShortcutCreate = (type: BlockType) => {
        if (focusedBlockId !== null) {
            addBlock(focusedBlockId, type, '');
        } else {
            addBlock(null, type, '');
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

    // AI 요약 생성 핸들러
    const handleGenerateSummary = async (style: SummaryStyle) => {
        if (!noteId) return;
        setIsSummaryLoading(true);
        try {
            const response = await summarizeNoteApi(noteId, { style });
            setSummary(response.summary);
            setSummaryStyle(response.style);
            setSummaryUpdatedAt(response.createdAt);
        } catch (error) {
            console.error("AI 요약 생성 실패:", error);
            alert("요약 생성에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSummaryLoading(false);
        }
    };



    if (isLoading) {
        return <div className="page-content-container">Loading...</div>;
    }

    return (
        <div className="page-content-container">
            {!isEditing ? (
                <div className="empty-note-state">
                    <NotebookPen className="empty-note-icon" />
                    <span className="empty-note-text">지식을 불러와주세요!</span>
                </div>
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
                        onAddBlockAfter={(id, type, initialContent) => addBlock(id, type, initialContent)}
                        // AI 요약 관련 props
                        summary={summary}
                        summaryStyle={summaryStyle}
                        summaryUpdatedAt={summaryUpdatedAt}
                        isSummaryLoading={isSummaryLoading}
                        onGenerateSummary={handleGenerateSummary}
                    />
                </div>
            )}
        </div>
    );
};

export default Note;
