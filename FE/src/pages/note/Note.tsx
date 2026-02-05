import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookPen } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { getNoteDetailApi } from '../../api/notes/GetNoteDetail.api';
import { updateNoteApi } from '../../api/notes/UpdateNote.api'; // ADDED
import { summarizeNoteApi } from '../../api/ai/NoteSummary.api';
import { emitNotesChanged } from '../../events/NotesEvents'; // ADDED
import type { SummaryStyle } from '../../types/ai/NoteSummary';
import { useYjsStore } from '../../hooks/useYjsStore';
import { useNoteStore } from '../../store/useNoteStore';
import { BlockType } from '../../types/note/Block';
import './Note.css';


const Note: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("제목 없는 노트");
    const [focusedBlockId, setFocusedBlockId] = useState<number | string | null>(null);

    // AI 요약 관련 state
    const [summary, setSummary] = useState<string | undefined>(undefined);
    const [summaryStyle, setSummaryStyle] = useState<string | undefined>(undefined);
    const [summaryUpdatedAt, setSummaryUpdatedAt] = useState<string | undefined>(undefined);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const { notes, updateNoteMetadata, fetchingIds, setFetchingId } = useNoteStore();
    const notesRef = useRef(notes);
    const fetchingIdsRef = useRef(fetchingIds); // FetchingIds 추합용 Ref
    const currentTitleRef = useRef(title); // 현재 제목 추적용

    // Sync state to refs
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    useEffect(() => {
        fetchingIdsRef.current = fetchingIds;
    }, [fetchingIds]);

    useEffect(() => {
        currentTitleRef.current = title;
    }, [title]);

    // 제목 input ref
    const titleInputRef = useRef<HTMLInputElement>(null);

    // 데이터 로딩 추적용 (컴포넌트 인스턴스별)
    const lastFetchedIdRef = useRef<string | null>(null);
    const pendingInitialDataRef = useRef<any>(null);
    const lastLoadedTitleRef = useRef<string>("제목 없는 노트");

    const { blocks, isSynced, addBlock, addBlocksBatch, updateBlock, deleteBlock, moveBlock } = useYjsStore(noteId);

    const fetchNoteDetail = useCallback(async (id: string) => {
        // 이미 해당 ID로 로딩 성공했거나 현재 이 인스턴스에서 시도 중이면 리턴
        if (lastFetchedIdRef.current === id) return;

        // 1. 캐시 확인 (NoteStore에서 해당 노트 정보를 이미 가지고 있는지)
        const cachedNote = notesRef.current.find(n => n.noteId === id);
        if (cachedNote && cachedNote.summary !== undefined) {
            console.log("[Note] Using cached metadata for:", id);
            setTitle(cachedNote.title);
            lastLoadedTitleRef.current = cachedNote.title;
            setSummary(cachedNote.summary);
            setSummaryStyle(cachedNote.summaryStyle);
            setSummaryUpdatedAt(cachedNote.summaryUpdatedAt);
            setIsEditing(true);
            lastFetchedIdRef.current = id;
            return;
        }

        // 2. 전역 fetch 관리 (Ref 사용으로 re-creation 방지)
        if (fetchingIdsRef.current[id]) return;
        setFetchingId(id, true);

        try {
            const noteRes = await getNoteDetailApi(id);
            console.log("[Note] Fetched Note Detail from API:", id);

            if (noteRes) {
                setTitle(noteRes.title || "제목 없는 노트");
                lastLoadedTitleRef.current = noteRes.title || "제목 없는 노트";
                setSummary(noteRes.summary);
                setSummaryStyle(noteRes.summaryStyle);
                setSummaryUpdatedAt(noteRes.summaryUpdatedAt);

                // Store 캐시 업데이트
                updateNoteMetadata(id, {
                    summary: noteRes.summary,
                    summaryStyle: noteRes.summaryStyle,
                    summaryUpdatedAt: noteRes.summaryUpdatedAt
                });

                // Yjs 초기 데이터 주입을 위해 저장
                pendingInitialDataRef.current = noteRes.blocks;
            }
            setIsEditing(true);
            lastFetchedIdRef.current = id;
        } catch (error) {
            console.error("노트 상세 정보 로딩 실패:", error);
            if (cachedNote) {
                setTitle(cachedNote.title);
                lastLoadedTitleRef.current = cachedNote.title;
                setIsEditing(true);
            }
        } finally {
            setFetchingId(id, false);
        }
    }, [updateNoteMetadata, setFetchingId]); // fetchingIds 제거

    // 노트 ID 변경 시 데이터 fetch
    useEffect(() => {
        if (noteId) {
            fetchNoteDetail(noteId);
        } else {
            lastFetchedIdRef.current = null;
            pendingInitialDataRef.current = null;
            setIsEditing(false);
            setTitle("제목 없는 노트");
            lastLoadedTitleRef.current = "제목 없는 노트";
        }
    }, [noteId, fetchNoteDetail]);

    // Yjs 동기화 완료 시 초기 데이터 주입 (최초 1회, Batch 처리)
    useEffect(() => {
        if (isSynced && blocks.length === 0 && pendingInitialDataRef.current && pendingInitialDataRef.current.length > 0) {
            console.log("[Note] Initializing Yjs with batch data");
            const blocksToInsert = pendingInitialDataRef.current.map((b: any) => ({
                type: b.type,
                content: b.content
            }));
            addBlocksBatch(blocksToInsert);
            pendingInitialDataRef.current = null;
        }
    }, [isSynced, blocks.length, addBlocksBatch]);

    // 사이드바 등 외부에서의 제목 변경 감지
    useEffect(() => {
        const handleNotesChanged = (e: any) => {
            if (!(e instanceof CustomEvent)) return;
            const detail = e.detail;

            // 자신이 보낸 이벤트 무시 (source 체크는 유지하되 값 기반 중복 방지 추가)
            if (detail?.source === 'NOTE_PAGE') return;

            if (detail?.type === 'UPDATE_TITLE' && detail.noteId === noteId) {
                // 값이 현재와 다를 때만 업데이트 (Loop Prevention - Value based)
                if (detail.title !== currentTitleRef.current) {
                    console.log("[Note] Remote title update detected:", detail.title);
                    setTitle(detail.title);
                    lastLoadedTitleRef.current = detail.title;
                }
            }

            if (detail?.type === 'DELETE_NOTE' && detail.noteId === noteId) {
                console.log("[Note] Current note deleted, redirecting...");
                navigate('/note');
            }
        };

        window.addEventListener('notes-changed', handleNotesChanged);
        return () => window.removeEventListener('notes-changed', handleNotesChanged);
    }, [noteId]);

    // Title Auto-save Debounce
    useEffect(() => {
        if (!noteId) return;
        // 로드된 후 변경되었을 때만 저장 (race condition 방지)
        if (title === lastLoadedTitleRef.current) return;

        const timer = setTimeout(async () => {
            try {
                await updateNoteApi(noteId, { title });
                lastLoadedTitleRef.current = title; // 저장 성공 시 업데이트

                // Sidebar 즉시 반영 트리거
                emitNotesChanged({
                    type: 'UPDATE_TITLE',
                    noteId,
                    title,
                    source: 'NOTE_PAGE',
                });
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
