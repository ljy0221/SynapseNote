import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookPen } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore'; // [New]
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
import { getNoteMembersApi } from '../../api/notes/GetNoteMembers.api'; // [New]
import { NoteMemberItem } from '../../types/note/GetNoteMembers'; // [New]
import { Loading } from '../../components/common/loading/Loading';
import './Note.css';


const Note: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();

    // [New] State declarations moved up to avoid TDZ
    const [myRole, setMyRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER' | undefined>(undefined);
    const [lastId, setLastId] = useState<string | null>(null); // [New] For sync reset
    const [noteMembers, setNoteMembers] = useState<NoteMemberItem[]>([]); // [New]
    const { userInfo } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);

    // [Fix] noteId 변경 시 렌더링 도중 즉시 상태 초기화하여 stale UI 방지
    if (noteId && noteId !== lastId) {
        setLastId(noteId);
        setMyRole(undefined);
        setIsEditing(false);
    }
    const [title, setTitle] = useState("제목 없는 노트");
    const [focusedBlockId, setFocusedBlockId] = useState<number | string | null>(null);
    const [isScrollPending, setIsScrollPending] = useState(false);

    // AI 요약 관련 state
    const [summary, setSummary] = useState<string | undefined>(undefined);
    const [summaryStyle, setSummaryStyle] = useState<string | undefined>(undefined);
    const [summaryUpdatedAt, setSummaryUpdatedAt] = useState<string | undefined>(undefined);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const { notes, updateNoteMetadata, fetchingIds, setFetchingId } = useNoteStore();
    const notesRef = useRef(notes);
    const fetchingIdsRef = useRef(fetchingIds);
    const currentTitleRef = useRef(title);
    const currentDirectoryPathRef = useRef<string | undefined>(undefined); // [New] 현재 경로 유지용

    // Sync state to refs
    useEffect(() => {
        console.log(`[NotePage] Mount noteId: ${noteId}`);
        return () => console.log(`[NotePage] Unmount noteId: ${noteId}`);
    }, []);

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
    const lastFetchedUserRef = useRef<any>(undefined); // [New] userInfo 변경 감지용 (초기값 undefined)
    const pendingInitialDataRef = useRef<any>(null);
    const lastLoadedTitleRef = useRef<string>("제목 없는 노트");
    const [bookmarkedBlockIds, setBookmarkedBlockIds] = useState<Set<string>>(new Set());

    // [New] 권한 체크: OWNER나 EDITOR가 아니면 전부 읽기 전용 (undefined 포함)
    const isReadOnly = myRole !== 'OWNER' && myRole !== 'EDITOR';

    const { blocks, isSynced, checkAndInitialize, addBlock, updateBlock, updateBlockLanguage, deleteBlock, moveBlock, setFocusedBlock, getBlockEditors } = useYjsStore(noteId);

    const fetchNoteDetail = useCallback(async (id: string) => {
        console.log(`[Note] fetchNoteDetail called for: ${id}, user: ${userInfo?.memberId}`);


        const cachedNote = notesRef.current.find(n => n.noteId === id);
        // [Modified] 항상 role을 체크하여 stale UI 방지
        const isUserChanged = lastFetchedUserRef.current !== userInfo;

        if (lastFetchedIdRef.current === id && !isUserChanged) {
            console.log(`[Note] Skipping fetch, already loaded: ${id}`);
            return;
        }

        // [Modified] 캐시 히트 시에도 role이 확실히 있는지 체크
        if (!isUserChanged && cachedNote && cachedNote.summary !== undefined && cachedNote.role) {
            console.log('[Note] Loaded from Cache (Full Detail):', { title: cachedNote.title, directoryPath: cachedNote.directoryPath, role: cachedNote.role });
            setTitle(cachedNote.title);
            lastLoadedTitleRef.current = cachedNote.title;
            currentDirectoryPathRef.current = cachedNote.directoryPath || "";

            setSummary(cachedNote.summary);
            setSummaryStyle(cachedNote.summaryStyle);
            setSummaryUpdatedAt(cachedNote.summaryUpdatedAt);

            // [New] 캐시에서 role 설정
            setMyRole(cachedNote.role);

            setIsEditing(true);
            lastFetchedIdRef.current = id;
            return;
        }

        if (fetchingIdsRef.current[id]) return;
        setFetchingId(id, true);

        try {
            console.log(`[Note] Requesting API for: ${id}`);

            // [Modified] 멤버 API 실패가 전체 노트로딩을 방해하지 않도록 별도 처리
            const noteRes = await getNoteDetailApi(id);
            let membersRes = { members: [] as any[] };
            try {
                membersRes = await getNoteMembersApi(id);
                setNoteMembers(membersRes.members || []); // [New]
            } catch (err) {
                console.warn('[Note] Failed to fetch member list, using detail info only:', err);
            }

            if (noteRes) {
                // [New] 사이드바 정보(목록)에서도 경로 확인
                const noteFromList = notesRef.current.find(n => n.noteId === id);
                const pathFromApi = noteRes.directoryPath;
                const pathFromList = noteFromList?.directoryPath;

                setTitle(noteRes.title || "제목 없는 노트");
                lastLoadedTitleRef.current = noteRes.title || "제목 없는 노트";
                currentDirectoryPathRef.current = pathFromApi ?? pathFromList ?? "";

                setSummary(noteRes.summary);
                setSummaryStyle(noteRes.summaryStyle);
                setSummaryUpdatedAt(noteRes.summaryUpdatedAt);

                // [New] Robust Role Calculation
                let calculatedRole: 'OWNER' | 'EDITOR' | 'VIEWER' = 'VIEWER';

                // 백엔드마다 ID 필드명이 다를 수 있으므로 모두 체크
                const getMemberId = (m: any) => m?.memberId || m?.userId || m?.id;

                const ownerId = String(getMemberId(noteRes.owner) || "");
                const currentMemberId = userInfo?.memberId ? String(userInfo.memberId) : null;

                console.log('[Note] Role Check Details:', {
                    ownerId,
                    currentMemberId,
                    membersCount: membersRes.members?.length,
                    membersSample: membersRes.members?.slice(0, 2).map((m: any) => ({ id: getMemberId(m), role: m.role }))
                });

                // 1. 멤버 리스트에서 먼저 찾기 (더 정확한 권한 정보)
                if (currentMemberId && membersRes.members) {
                    const member = membersRes.members.find((m: any) => String(getMemberId(m)) === currentMemberId);
                    if (member && member.role) {
                        calculatedRole = member.role;
                    }
                }

                // 2. 오너인 경우 강제로 OWNER 처리
                if (currentMemberId && ownerId === currentMemberId) {
                    calculatedRole = 'OWNER';
                }

                // 3. 노트 상세의 멤버 정보에서도 찾기 (만약 멤버 API가 실패했고 상세 API에는 정보가 있다면)
                if (calculatedRole === 'VIEWER' && currentMemberId && noteRes.members) {
                    const memberInDetail = noteRes.members.find((m: any) => String(getMemberId(m)) === currentMemberId);
                    if (memberInDetail && memberInDetail.role) {
                        calculatedRole = memberInDetail.role;
                    }
                }

                console.log('[Note] Final Calculated Role:', calculatedRole);
                setMyRole(calculatedRole);

                updateNoteMetadata(id, {
                    summary: noteRes.summary,
                    summaryStyle: noteRes.summaryStyle,
                    summaryUpdatedAt: noteRes.summaryUpdatedAt,
                    role: calculatedRole
                });

                // [New] 노트 상세 조회 시 북마크 정보도 함께 초기화 (기존 상태 유지하며 병합)
                const bookmarkedIdsFromDetail = noteRes.blocks
                    .filter((b: any) => b.bookmark)
                    .map((b: any) => b.id.toString());

                setBookmarkedBlockIds(prev => {
                    const next = new Set(prev);
                    bookmarkedIdsFromDetail.forEach((id: string) => next.add(id));
                    return next;
                });

                pendingInitialDataRef.current = noteRes.blocks;
            }
            setIsEditing(true);
            lastFetchedIdRef.current = id;
            lastFetchedUserRef.current = userInfo; // [New] Update last verified user
        } catch (error) {
            console.error("노트 상세 정보 로딩 실패:", error);
            if (cachedNote) {
                console.log('[Note] Fallback to Cache (API Failed):', { title: cachedNote.title, role: cachedNote.role });
                setTitle(cachedNote.title);
                lastLoadedTitleRef.current = cachedNote.title;
                currentDirectoryPathRef.current = cachedNote.directoryPath || "";

                // 캐시의 role을 설정하되, 없으면 기본값 부여하지 않고 fetch 대기 (이미 isReadOnly가 true이므로 안전)
                if (cachedNote.role) setMyRole(cachedNote.role);

                setIsEditing(true);
            }
        } finally {
            setFetchingId(id, false);
        }
    }, [updateNoteMetadata, setFetchingId, userInfo]);

    // [New] 노트 진입 시 즐겨찾기 상태 강제 동기화 (로컬 상태)
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (noteId) {
                try {
                    // size를 충분히 크게 설정하여 현재 노트의 북마크를 최대한 가져옴
                    // 근본적으로는 getNoteDetailApi에서 bookmark 여부를 정확히 내려주는 것이 좋으나,
                    // 백엔드 구조상 어렵다면 이 방식이 차선책임.
                    const response = await getBlockBookmarksApi({ size: 1000 });
                    if (response && response.content) {
                        const myBookmarks = response.content
                            .filter((b: any) => b.noteId === noteId)
                            .map((b: any) => String(b.blockId));

                        setBookmarkedBlockIds(prev => {
                            const next = new Set(prev);
                            myBookmarks.forEach((id: string) => next.add(id));
                            return next;
                        });
                    }
                } catch (error) {
                    console.error('[Note] Failed to fetch bookmarks:', error);
                }
            }
        };
        fetchBookmarks();
    }, [noteId]);

    // 노트 ID 변경 시 데이터 fetch
    useEffect(() => {
        if (noteId) {
            // [Fix] Reset state when switching notes to avoid stale UI
            setMyRole(undefined);
            setIsEditing(false); // Show loading state instead of old content
            setBookmarkedBlockIds(new Set()); // [New] 노트 변경 시 북마크 상태 초기화
            lastFetchedIdRef.current = null; // Ensure re-fetch if cache hit fails

            fetchNoteDetail(noteId);
        } else {
            lastFetchedIdRef.current = null;
            pendingInitialDataRef.current = null;
            setIsEditing(false);
            setTitle("제목 없는 노트");
            lastLoadedTitleRef.current = "제목 없는 노트";
            currentDirectoryPathRef.current = undefined; // 초기화
            setMyRole(undefined);
        }
    }, [noteId, fetchNoteDetail]);

    // Yjs 동기화 완료 시 초기 데이터 주입 (최초 1회, Batch 처리)
    // Yjs 동기화 완료 시 초기 데이터 주입 (최초 1회, Batch 처리)
    useEffect(() => {
        // [Modified] isSynced가 true이면 데이터 로드 여부와 관계없이 Yjs 실제 상태를 확인하여 초기화 시도
        // blocks.length 체크 제거 (Stale State 문제 해결)
        if (isSynced && pendingInitialDataRef.current && pendingInitialDataRef.current.length > 0) {
            console.log('[Note] Sync detected. Waiting 300ms before checking initialization to prevent race conditions...');

            const timer = setTimeout(() => {
                if (!pendingInitialDataRef.current) return;

                console.log('[Note] Checking and populating initial blocks (after delay)...');
                const blocksToInsert = pendingInitialDataRef.current.map((b: any) => ({
                    type: b.type,
                    content: b.content,
                    bookmark: b.bookmark || false
                }));
                checkAndInitialize(blocksToInsert);
                pendingInitialDataRef.current = null;
            }, 300); // 300ms delay to ensure Yjs data is fully loaded

            return () => clearTimeout(timer);
        }
    }, [isSynced, checkAndInitialize]);

    const handleToggleBookmark = async (blockId: number | string, currentStatus: boolean) => {
        if (!noteId) return;

        const idStr = blockId.toString();

        // 낙관적 업데이트: 로컬 상태 즉시 변경
        setBookmarkedBlockIds(prev => {
            const next = new Set(prev);
            if (next.has(idStr)) {
                next.delete(idStr);
            } else {
                next.add(idStr);
            }
            return next;
        });

        try {
            if (currentStatus) {
                await removeBlockBookmarkApi(noteId, idStr);
            } else {
                await addBlockBookmarkApi(noteId, idStr);
            }
        } catch (error: any) {
            console.error('북마크 토글 API 실패:', error);
            // 실패 시 롤백
            setBookmarkedBlockIds(prev => {
                const next = new Set(prev);
                if (currentStatus) {
                    next.add(idStr); // 원래대로 복구 (있었던 상태로)
                } else {
                    next.delete(idStr); // 원래대로 복구 (없었던 상태로)
                }
                return next;
            });
            alert('북마크 변경에 실패했습니다.');
        }
    };

    const location = useLocation();

    // Scroll to block if present in URL with Stabilization
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const blockId = params.get('block');

        if (!blockId) return;

        // 블록 데이터가 아직 로드되지 않았으면 대기 (Loading 화면 유지 여부는 기획에 따라 결정, 여기선 일단 리턴)
        if (blocks.length === 0) return;

        setIsScrollPending(true);

        const stabilizeAndScroll = (element: HTMLElement) => {
            console.log(`[Note] Block found, starting stabilization: ${blockId}`);

            let debounceTimer: NodeJS.Timeout;

            // ResizeObserver: 크기 변화가 멈출 때까지 대기
            const resizeObserver = new ResizeObserver(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    console.log(`[Note] Block stabilized, scrolling now: ${blockId}`);
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setFocusedBlockId(blockId);
                    setIsScrollPending(false);
                    resizeObserver.disconnect();
                }, 200); // 200ms 동안 변화 없으면 안정화로 간주
            });

            resizeObserver.observe(element);

            // 초기 트리거 (이미 안정된 상태일 수도 있으므로)
            // ResizeObserver는 observe 직후 콜백을 한 번 호출하므로 별도 호출 불필요할 수 있으나,
            // 확실하게 하기 위해 1회 observe 시작.

            // 안전 장치: 3초가 지나도 안정화 안되면 강제 스크롤 및 종료
            const safetyTimeout = setTimeout(() => {
                console.warn(`[Note] Scroll stabilization timed out: ${blockId}`);
                resizeObserver.disconnect();
                clearTimeout(debounceTimer);
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setFocusedBlockId(blockId);
                setIsScrollPending(false);
            }, 3000);

            return () => {
                resizeObserver.disconnect();
                clearTimeout(debounceTimer);
                clearTimeout(safetyTimeout);
            };
        };

        const element = document.getElementById(blockId);
        let cleanupStabilize: (() => void) | undefined;

        if (element) {
            cleanupStabilize = stabilizeAndScroll(element);
        } else {
            // 아직 DOM에 없을 경우 찾을 때까지 대기
            console.log(`[Note] Block not found yet, observing DOM for: ${blockId}`);
            const observer = new MutationObserver((_mutations, obs) => {
                const target = document.getElementById(blockId);
                if (target) {
                    obs.disconnect();
                    cleanupStabilize = stabilizeAndScroll(target);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // 10초 동안 못 찾으면 포기
            const findTimeout = setTimeout(() => {
                observer.disconnect();
                if (isScrollPending) setIsScrollPending(false);
                console.warn(`[Note] Failed to find block ${blockId} for scrolling.`);
            }, 10000);

            return () => {
                observer.disconnect();
                clearTimeout(findTimeout);
                if (cleanupStabilize) cleanupStabilize();
            };
        }

        return () => {
            if (cleanupStabilize) cleanupStabilize();
        };
    }, [location.search, blocks.length]);


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
                // [Modified] 디렉토리 경로 유지
                console.log('[Note] Auto-saving Title:', { title, directoryPath: currentDirectoryPathRef.current });
                await updateNoteApi(noteId, {
                    title,
                    directoryPath: currentDirectoryPathRef.current
                });
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

    // 🔥 포커스된 블록이 원격에서 삭제되었는지 감지
    useEffect(() => {
        if (focusedBlockId && blocks.length > 0) {
            const blockExists = blocks.some(b => b.id === focusedBlockId);
            if (!blockExists) {
                console.warn('[Note] Focused block was deleted remotely, moving focus');
                // 첫 번째 블록으로 안전하게 이동
                const firstBlock = blocks[0];
                if (firstBlock) {
                    setFocusedBlockId(firstBlock.id);
                } else {
                    setFocusedBlockId(null);
                }
            }
        }
    }, [blocks, focusedBlockId]);


    // [New] 내용 변경 감지 및 자동 저장 (updatedAt 갱신용) -> 백엔드 Yjs BridgeService에서 처리하므로 API 호출 제거
    // 단, 사이드바 목록 갱신(최신순 정렬 등)을 위해 이벤트는 발생시킴
    const contentSaveTimer = useRef<NodeJS.Timeout | null>(null);

    const handleContentChange = useCallback(() => {
        if (!noteId) return;
        if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);

        contentSaveTimer.current = setTimeout(() => {
            // [Modified] updateNoteApi 제거 (백엔드에서 처리)
            // 사이드바 및 홈 화면 갱신 알림만 전송
            emitNotesChanged({
                type: 'UPDATE_CONTENT',
                noteId,
                title: currentTitleRef.current,
                source: 'NOTE_PAGE',
            });
        }, 1000); // 1초 디바운스
    }, [noteId]);

    const handleAddBlockAtEnd = (type: BlockType) => {
        addBlock(null, type, '');
        handleContentChange();
    };

    const handleShortcutCreate = (type: BlockType) => {
        if (focusedBlockId !== null) {
            addBlock(focusedBlockId, type, '');
        } else {
            addBlock(null, type, '');
        }
        handleContentChange();
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
                if (currentIndex === -1) return; // 이미 삭제됨

                // 🔥 삭제 전에 다음 포커스 대상 결정
                let nextFocusId: number | string | null = null;
                if (currentIndex > 0) {
                    nextFocusId = blocks[currentIndex - 1].id;
                } else if (blocks.length > 1) {
                    nextFocusId = blocks[currentIndex + 1].id;
                }

                // 마지막 블록 삭제 시 새 블록 자동 생성
                const isLastBlock = blocks.length === 1;

                deleteBlock(focusedBlockId);
                handleContentChange(); // [New] 삭제 시에도 갱신

                if (isLastBlock) {
                    // 마지막 블록 삭제 시 새 빈 텍스트 블록 생성
                    setTimeout(() => {
                        addBlock(null, 'text', '');
                    }, 100);
                } else if (nextFocusId) {
                    // 🔥 포커스 이동 시 블록 존재 여부 재확인 (동시 삭제 대응)
                    setTimeout(() => {
                        const targetExists = document.getElementById(nextFocusId.toString());
                        if (targetExists) {
                            setFocusedBlockId(nextFocusId);
                        } else {
                            // 대상 블록이 없으면 첫 번째 블록으로 폴백
                            console.warn('[Note] Target focus block was deleted, falling back to first block');
                            const firstBlock = blocks[0];
                            if (firstBlock) setFocusedBlockId(firstBlock.id);
                        }
                    }, 50);
                }
            }
        }
    };

    const handleMoveBlock = (dragIndex: number, hoverIndex: number) => {
        moveBlock(dragIndex, hoverIndex);
        handleContentChange(); // [New] 이동 시에도 갱신
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
            {isScrollPending && <Loading message="블록으로 이동 중..." fullScreen={true} />}
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
                    onClick={() => {
                        setFocusedBlockId(null);
                        setFocusedBlock(null); // [Fix] Clear awareness state when clicking outside blocks
                    }}
                >
                    <NoteMain
                        noteId={noteId}
                        readOnly={isReadOnly} // [New]
                        title={title}
                        onUpdateTitle={setTitle}
                        blocks={blocks}
                        onUpdateBlock={(id, content) => {
                            updateBlock(id, content);
                            handleContentChange();
                        }}
                        onAddBlockAtEnd={handleAddBlockAtEnd}
                        onDeleteBlock={(id) => {
                            deleteBlock(id);
                            handleContentChange();
                        }}
                        onFocusBlock={(blockId) => {
                            setFocusedBlockId(blockId);
                            setFocusedBlock(blockId ? blockId.toString() : null); // [New] Update awareness
                        }}
                        focusedBlockId={focusedBlockId}
                        onMoveBlock={handleMoveBlock}
                        titleInputRef={titleInputRef}
                        onAddBlockAfter={(id, type, initialContent) => {
                            addBlock(id, type, initialContent);
                            handleContentChange();
                        }}
                        summary={summary}
                        summaryStyle={summaryStyle}
                        summaryUpdatedAt={summaryUpdatedAt}
                        isSummaryLoading={isSummaryLoading}
                        onGenerateSummary={handleGenerateSummary}
                        onToggleBookmark={handleToggleBookmark}
                        bookmarkedBlockIds={bookmarkedBlockIds}
                        onUpdateBlockLanguage={updateBlockLanguage}
                        currentUserRole={myRole}
                        showBlockBookmark={myRole === 'OWNER'} // [New]
                        members={noteMembers} // [New]
                        getBlockEditors={getBlockEditors} // [New] Pass awareness method
                    />
                </div>
            )}
        </div>
    );
};

export default Note;
