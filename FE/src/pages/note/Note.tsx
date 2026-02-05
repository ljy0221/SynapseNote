import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookPen } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NoteMain from "../../components/layout/noteMain/NoteMain";
import { getNoteDetailApi } from '../../api/notes/GetNoteDetail.api';
import { updateNoteApi } from '../../api/notes/UpdateNote.api';
import { summarizeNoteApi } from '../../api/ai/NoteSummary.api';
import { emitNotesChanged } from '../../events/NotesEvents';
import type { SummaryStyle } from '../../types/ai/NoteSummary';
import { useYjsStore } from '../../hooks/useYjsStore';
import { useNoteStore } from '../../store/useNoteStore';
import { BlockType } from '../../types/note/Block';
import { addBlockBookmarkApi, removeBlockBookmarkApi, getBlockBookmarksApi } from '../../api/bookmark/Bookmarks.api';
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
    const fetchingIdsRef = useRef(fetchingIds);
    const currentTitleRef = useRef(title);

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

    const { blocks, isSynced, addBlock, addBlocksBatch, updateBlock, deleteBlock, moveBlock, setBlockBookmark, syncBlockBookmarks } = useYjsStore(noteId);

    const fetchNoteDetail = useCallback(async (id: string) => {
        if (lastFetchedIdRef.current === id) return;

        const cachedNote = notesRef.current.find(n => n.noteId === id);
        if (cachedNote && cachedNote.summary !== undefined) {
            setTitle(cachedNote.title);
            lastLoadedTitleRef.current = cachedNote.title;
            setSummary(cachedNote.summary);
            setSummaryStyle(cachedNote.summaryStyle);
            setSummaryUpdatedAt(cachedNote.summaryUpdatedAt);
            setIsEditing(true);
            lastFetchedIdRef.current = id;
            return;
        }

        if (fetchingIdsRef.current[id]) return;
        setFetchingId(id, true);

        try {
            const noteRes = await getNoteDetailApi(id);
            if (noteRes) {
                setTitle(noteRes.title || "제목 없는 노트");
                lastLoadedTitleRef.current = noteRes.title || "제목 없는 노트";
                setSummary(noteRes.summary);
                setSummaryStyle(noteRes.summaryStyle);
                setSummaryUpdatedAt(noteRes.summaryUpdatedAt);

                updateNoteMetadata(id, {
                    summary: noteRes.summary,
                    summaryStyle: noteRes.summaryStyle,
                    summaryUpdatedAt: noteRes.summaryUpdatedAt
                });

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
    }, [updateNoteMetadata, setFetchingId]);

    // [New] 노트 진입 시 즐겨찾기 상태 강제 동기화
    useEffect(() => {
        const syncBookmarks = async () => {
            if (isSynced && noteId) {
                try {
                    console.log(`[Note] Syncing bookmarks with server for note: ${noteId}`);
                    const response = await getBlockBookmarksApi({ size: 100 });
                    if (response && response.content) {
                        const bookmarkedIds = response.content.map((b: any) => b.blockId);
                        syncBlockBookmarks(bookmarkedIds);
                    }
                } catch (error) {
                    console.error('[Note] Failed to sync bookmarks from server:', error);
                }
            }
        };
        syncBookmarks();
    }, [isSynced, noteId, syncBlockBookmarks]);

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
            const blocksToInsert = pendingInitialDataRef.current.map((b: any) => ({
                type: b.type,
                content: b.content,
                bookmark: b.bookmark || false
            }));
            addBlocksBatch(blocksToInsert);
            pendingInitialDataRef.current = null;
        }
    }, [isSynced, blocks.length, addBlocksBatch]);

    const handleToggleBookmark = async (blockId: number | string, currentStatus: boolean) => {
        if (!noteId) return;

        // 낙관적 업데이트: API 결과와 상관없이 Yjs 상태를 먼저 변경하여 UI 반응성 확보
        const newStatus = !currentStatus;
        setBlockBookmark(blockId, newStatus);

        try {
            if (currentStatus) {
                await removeBlockBookmarkApi(noteId, blockId as string);
            } else {
                await addBlockBookmarkApi(noteId, blockId as string);
            }
        } catch (error: any) {
            console.error('북마크 토글 API 실패:', error);
            // 대시보드에서 이미 삭제된 경우 등의 이유로 실패하더라도 
            // Yjs 상태는 이미 사용자의 동작에 맞춰져 있으므로 사용자 경험상 이득입니다.
        }
    };

    const location = useLocation();

    // Scroll to block if present in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const blockId = params.get('block');
        if (blockId && isSynced && blocks.length > 0) {
            console.log(`[Note] Scroll attempt for blockId: ${blockId}`);
            console.log(`[Note] Total blocks in state: ${blocks.length}`);

            let attempts = 0;
            const maxAttempts = 15; // 최대 3초 (15 * 200ms)

            const tryScroll = () => {
                // DraggableBlock.tsx에서 id={block.id.toString()} 로 설정됨
                const element = document.getElementById(blockId);

                if (element) {
                    console.log(`[Note] SUCCESS: Block element found for ID: ${blockId}. Scrolling...`);
                    // block: 'start'로 변경하여 화면 최상단에 보이게 함
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setFocusedBlockId(blockId);
                    return true;
                }

                attempts++;
                if (attempts % 5 === 0) {
                    console.log(`[Note] Still searching for block element... (Attempt ${attempts}/${maxAttempts})`);
                    const blockExists = blocks.some(b => String(b.id) === blockId);
                    if (!blockExists) {
                        console.warn(`[Note] BLOCK NOT FOUND IN STATE: ${blockId}. Available IDs:`, blocks.map(b => b.id));
                    }
                }

                if (attempts < maxAttempts) {
                    return false;
                }

                console.error(`[Note] FAILED: Block element not found after ${maxAttempts} attempts: ${blockId}`);
                return true;
            };

            // Immediate attempt
            if (!tryScroll()) {
                const timer = setInterval(() => {
                    if (tryScroll()) {
                        clearInterval(timer);
                    }
                }, 200);
                return () => clearInterval(timer);
            }
        }
    }, [location.search, isSynced, blocks.length]);

    // 사이드바 등 외부에서의 제목 변경 감지
    useEffect(() => {
        const handleNotesChanged = (e: any) => {
            if (!(e instanceof CustomEvent)) return;
            const detail = e.detail;
            if (detail?.source === 'NOTE_PAGE') return;

            if (detail?.type === 'UPDATE_TITLE' && detail.noteId === noteId) {
                if (detail.title !== currentTitleRef.current) {
                    setTitle(detail.title);
                    lastLoadedTitleRef.current = detail.title;
                }
            }

            if (detail?.type === 'DELETE_NOTE' && detail.noteId === noteId) {
                navigate('/note');
            }
        };

        window.addEventListener('notes-changed', handleNotesChanged);
        return () => window.removeEventListener('notes-changed', handleNotesChanged);
    }, [noteId, navigate]);

    // Title Auto-save Debounce
    useEffect(() => {
        if (!noteId) return;
        if (title === lastLoadedTitleRef.current) return;

        const timer = setTimeout(async () => {
            try {
                await updateNoteApi(noteId, { title });
                lastLoadedTitleRef.current = title;
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
                        summary={summary}
                        summaryStyle={summaryStyle}
                        summaryUpdatedAt={summaryUpdatedAt}
                        isSummaryLoading={isSummaryLoading}
                        onGenerateSummary={handleGenerateSummary}
                        onToggleBookmark={handleToggleBookmark}
                    />
                </div>
            )}
        </div>
    );
};

export default Note;
