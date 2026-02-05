// src/components/layout/sidebar/Sidebar.tsx
import React, { useEffect, useState, useCallback } from 'react';
import './Sidebar.css';
import { Plus } from 'lucide-react';

import type { NoteListItem } from '../../../types/note/GetNotes';
import type { ContextMenuState } from '../../../types/sidebar/ContextMenu';

import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';
import { VoiceChannelSidebar } from './VoiceChannelSidebar';

import ContextMenu from '../../common/contextMenu/ContextMenu';
import MoveNoteModal from './MoveNoteModal';

import { getNotesApi } from '../../../api/notes/Notes.api';
import { adaptNotesForSidebar } from '../../../api/notes/Notes.adapter';

import {
  getBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
} from '../../../api/bookmark/Bookmarks.api';
import { adaptBookmarkIds } from '../../../api/bookmark/Bookmarks.adapter';


import { deleteNoteApi } from '../../../api/notes/DeleteNote.api';
import { updateNoteApi } from '../../../api/notes/UpdateNote.api';

import {
  NOTES_CHANGED_EVENT,
  emitNotesChanged,
} from '../../../events/NotesEvents';

import { useNavigate, useParams } from 'react-router-dom';
import { useCreateNote } from '../../../hooks/useCreateNote';
import { useNoteStore } from '../../../store/useNoteStore';
import { useAuthStore } from '../../../store/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  showToggle?: boolean; // [New] 토글 버튼 노출 여부 (기본값 true)
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, showToggle = true }) => {
  const navigate = useNavigate();
  const { noteId: routeNoteId } = useParams<{ noteId: string }>();
  const activeNoteId = routeNoteId ?? null;

  const { notes, setNotes } = useNoteStore();
  const { userInfo, accessToken } = useAuthStore();

  // Helper for member names (Simple fallback for now)
  const getMemberName = useCallback((memberId: string) => {
    // If it's me
    if (userInfo?.memberId === memberId) return userInfo.name;
    // Ideally we would look up from a member store or cache.
    // For now returning ID slice or 'Unknown'
    return `User ${memberId.slice(0, 4)}`;
  }, [userInfo]);
  const [favoriteNoteIds, setFavoriteNoteIds] =
    useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const [contextMenu, setContextMenu] =
    useState<ContextMenuState>({ visible: false });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [moveModal, setMoveModal] = useState<{
    open: boolean;
    noteId: string | null;
    currentPath: string;
  }>({
    open: false,
    noteId: null,
    currentPath: '',
  });

  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  /** -------------------------
   * 디렉토리 경로 정규화
   -------------------------- */
  const normalizeDirectoryPath = (path: string) => {
    let p = path.trim();
    if (!p) return '/';
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  };

  const noteTree = buildNoteTree(notes);

  /** -------------------------
   * Sidebar 전체 로딩 (페이지네이션 제거)
   -------------------------- */
  const loadNotes = useCallback(async (pageNum: number, isInitial: boolean = false, signal?: AbortSignal, isSilent: boolean = false) => {
    if (isInitial && !isSilent) setIsLoading(true);

    try {
      const filter = activeTab === 'personal' ? 'OWNED' : 'SHARED';
      const res = await getNotesApi({ page: pageNum, filter, size: 20 }, signal);
      const pageNotes = adaptNotesForSidebar(res);

      setNotes(prev => isInitial ? pageNotes : [...prev, ...pageNotes]);
      setHasMore(res.currentPage < res.totalPages);
      setPage(res.currentPage);

      if (isInitial) {
        const bookmarksRes = await getBookmarksApi();
        setFavoriteNoteIds(adaptBookmarkIds(bookmarksRes));
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        console.log('Request canceled');
      } else {
        console.error('Failed to load notes', err);
      }
    } finally {
      if (isInitial && !isSilent) setIsLoading(false);
    }
  }, [activeTab]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    loadNotes(page + 1);
  }, [isLoading, hasMore, page, loadNotes]);

  /** 최초 로딩 + 탭 변경 시 리셋 */
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadNotes(1, true, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeTab, loadNotes]);

  /** 무한 스크롤 옵저버 */
  useEffect(() => {
    if (!observerTarget.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  /** 외부 변경 이벤트 */
  useEffect(() => {
    const handleNotesChanged = (e: any) => {
      if (!(e instanceof CustomEvent)) return;
      const detail = e.detail;

      if (detail?.source === 'SIDEBAR') return; // 자신이 보낸 이벤트는 무시

      if (detail?.type === 'UPDATE_TITLE') {
        setNotes(prev =>
          prev.map(n =>
            n.noteId === detail.noteId
              ? { ...n, title: detail.title }
              : n
          )
        );
        return;
      }

      if (detail?.skipRefetch) return;

      loadNotes(1, true, undefined, true); // Silent refresh
    };

    window.addEventListener(NOTES_CHANGED_EVENT, handleNotesChanged);
    return () =>
      window.removeEventListener(NOTES_CHANGED_EVENT, handleNotesChanged);
  }, [loadNotes]);


  /** -------------------------
   * 노트 선택
   -------------------------- */
  const handleSelectNote = (noteId: string) => {
    if (!noteId || noteId.startsWith('temp-')) return;
    navigate(`/note/${noteId}`);
  };

  /** -------------------------
   * 즐겨찾기
   -------------------------- */
  const handleToggleFavorite = async (noteId: string) => {
    if (!noteId || noteId.startsWith('temp-')) return;

    const isFavorite = favoriteNoteIds.has(noteId);

    setFavoriteNoteIds(prev => {
      const next = new Set(prev);
      isFavorite ? next.delete(noteId) : next.add(noteId);
      return next;
    });

    try {
      isFavorite
        ? await removeBookmarkApi(noteId)
        : await addBookmarkApi(noteId);
      emitNotesChanged({ skipRefetch: true, source: 'SIDEBAR' }); // 상태 변경 알림
    } catch {
      setFavoriteNoteIds(prev => {
        const next = new Set(prev);
        isFavorite ? next.add(noteId) : next.delete(noteId);
        return next;
      });
    }
  };

  /** -------------------------
   * 노트 제목 수정 (즉시 반영)
   -------------------------- */
  const handleConfirmRename = async (
    noteId: string,
    newTitle: string
  ) => {
    if (!newTitle.trim()) return;

    const target = notes.find(n => n.noteId === noteId);
    if (!target) return;

    setNotes(prev =>
      prev.map(n =>
        n.noteId === noteId ? { ...n, title: newTitle } : n
      )
    );
    setEditingNoteId(null);

    try {
      await updateNoteApi(noteId, {
        title: newTitle,
        directoryPath: target.directoryPath,
      });
      emitNotesChanged({
        type: 'UPDATE_TITLE',
        noteId,
        title: newTitle,
        source: 'SIDEBAR',
      });
    } catch {
      emitNotesChanged();
    }
  };

  /** -------------------------
   * 노트 이동
   -------------------------- */
  const handleMoveNote = async (noteId: string, newPath: string) => {
    const normalizedPath = normalizeDirectoryPath(newPath);
    const target = notes.find(n => n.noteId === noteId);
    if (!target) return;

    setNotes(prev =>
      prev.map(n =>
        n.noteId === noteId
          ? { ...n, directoryPath: normalizedPath }
          : n
      )
    );

    try {
      await updateNoteApi(noteId, {
        title: target.title,
        directoryPath: normalizedPath,
      });
      emitNotesChanged({ skipRefetch: true, source: 'SIDEBAR' });
    } catch {
      emitNotesChanged();
    }
  };

  /** -------------------------
   * 노트 생성 (temp → real)
   -------------------------- */
  const { handleCreateNote: createNote } = useCreateNote();

  const handleCreateNote = async (directoryPath: string) => {
    if (activeTab !== 'personal') {
      setActiveTab('personal');
    }

    await createNote(directoryPath, {
      onOptimisticUpdate: (noteId, memberId) => {
        const tempNote: NoteListItem = {
          memberId,
          noteId,
          title: '새 노트',
          directoryPath,
          pointX: 0,
          pointY: 0,
          role: 'OWNER',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setNotes(prev => [...prev, tempNote]);
      },
      onError: (noteId) => {
        setNotes(prev => prev.filter(n => n.noteId !== noteId));
      }
    });
  };

  /** -------------------------
   * 노트 삭제
   -------------------------- */
  const handleDeleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.noteId !== noteId));
    try {
      await deleteNoteApi(noteId);
      emitNotesChanged({
        type: 'DELETE_NOTE',
        noteId,
        source: 'SIDEBAR'
      });
    } catch {
      emitNotesChanged();
    }
  };


  return (
    <div className="sidebar-wrapper">
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-top-actions">
            <button
              className="sidebar-add-note-btn"
              onClick={() => handleCreateNote('/')}
            >
              <Plus size={16} />
              <span className="label">새 노트</span>
            </button>
          </div>

          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              내 노트
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
              onClick={() => setActiveTab('shared')}
            >
              공유받은 노트
            </button>
          </div>

          {isLoading ? (
            <div className="sidebar-loading">Loading...</div>
          ) : (
            <div className="sidebar-content">
              <NoteDirectory
                node={noteTree}
                activeNoteId={activeNoteId}
                favoriteNoteIds={favoriteNoteIds}
                editingNoteId={editingNoteId}
                onSelectNote={handleSelectNote}
                onToggleFavorite={handleToggleFavorite}
                onContextMenu={setContextMenu}
                onConfirmRename={handleConfirmRename}
                onCancelRename={() => setEditingNoteId(null)}
                onMoveNote={handleMoveNote}
              />
              <div ref={observerTarget} style={{ height: '20px' }} />
            </div>
          )}


          {activeNoteId && userInfo && accessToken ? (
            <VoiceChannelSidebar
              noteId={activeNoteId}
              user={userInfo}
              accessToken={accessToken}
              getMemberName={getMemberName}
            />
          ) : null}
        </div>
      </aside>

      {showToggle && (
        <button
          className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`}
          onClick={onToggle}
        >
          {isOpen ? '⟨' : '⟩'}
        </button>
      )}

      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu({ visible: false })}
        onDeleteNote={handleDeleteNote}
        onCreateNote={handleCreateNote}
        onRenameNote={setEditingNoteId}
        onMoveNote={(noteId, directoryPath) =>
          setMoveModal({
            open: true,
            noteId,
            currentPath: directoryPath,
          })
        }
      />

      {
        moveModal.open && (
          <MoveNoteModal
            isOpen
            currentPath={moveModal.currentPath}
            onCancel={() =>
              setMoveModal({ open: false, noteId: null, currentPath: '' })
            }
            onConfirm={async path => {
              if (!moveModal.noteId) return;
              await handleMoveNote(moveModal.noteId, path);
              setMoveModal({ open: false, noteId: null, currentPath: '' });
            }}
          />
        )
      }
    </div >
  );
};
