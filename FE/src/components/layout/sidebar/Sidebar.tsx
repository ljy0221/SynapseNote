// src/components/layout/sidebar/Sidebar.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import './Sidebar.css';
import { Plus } from 'lucide-react';

import type { NoteListItem } from '../../../types/note/GetNotes';
import type { ContextMenuState } from '../../../types/sidebar/ContextMenu';

import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';

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

import { createNoteApi } from '../../../api/notes/CreateNote.api';
import { deleteNoteApi } from '../../../api/notes/DeleteNote.api';
import { updateNoteApi } from '../../../api/notes/UpdateNote.api';

import {
  NOTES_CHANGED_EVENT,
  emitNotesChanged,
} from '../../../events/NotesEvents';

import { useNavigate, useParams } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const navigate = useNavigate();
  const { noteId: routeNoteId } = useParams<{ noteId: string }>();

  /** active 상태의 단일 기준 = URL */
  const activeNoteId = routeNoteId ?? null;

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [favoriteNoteIds, setFavoriteNoteIds] =
    useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const [contextMenu, setContextMenu] =
    useState<ContextMenuState>({ visible: false });

  /** Pagination states */
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  /** rename 상태 */
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  /** move modal 상태 */
  const [moveModal, setMoveModal] = useState<{
    open: boolean;
    noteId: string | null;
    currentPath: string;
  }>({
    open: false,
    noteId: null,
    currentPath: '',
  });

  /** 디렉토리 경로 정규화 */
  const normalizeDirectoryPath = (path: string) => {
    let p = path.trim();

    // 빈 값 방지
    if (!p) return '/';

    // 항상 /로 시작
    if (!p.startsWith('/')) {
      p = '/' + p;
    }

    // 끝의 / 제거 (루트 제외)
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }

    return p;
  };


  const noteTree = buildNoteTree(notes);

  /**
   * Sidebar 단일 진실 소스
   */
  const fetchSidebarData = useCallback(async (targetPage: number = 1) => {
    if (targetPage === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const [notesRes, bookmarksRes] = await Promise.all([
        getNotesApi({ page: targetPage }),
        targetPage === 1 ? getBookmarksApi() : Promise.resolve(null),
      ]);

      const newNotes = adaptNotesForSidebar(notesRes);

      setNotes(prev => {
        if (targetPage === 1) return newNotes;

        // 중복 방지: 기존 노트 ID와 겹치지 않는 것만 추가
        const existingIds = new Set(prev.map(n => n.noteId));
        const uniqueNewNotes = newNotes.filter(n => !existingIds.has(n.noteId));
        return [...prev, ...uniqueNewNotes];
      });

      if (bookmarksRes) {
        setFavoriteNoteIds(adaptBookmarkIds(bookmarksRes));
      }

      setHasMore(notesRes.currentPage < notesRes.totalPages);
      setPage(notesRes.currentPage);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  /**
   * 무한 스크롤 관찰기
   */
  useEffect(() => {
    if (isLoading || !hasMore || isFetchingMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchSidebarData(page + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, hasMore, isFetchingMore, page, fetchSidebarData]);

  /**
   * 최초 로딩 + 이벤트 구독
   */
  useEffect(() => {
    fetchSidebarData(1);
    const handleNotesChanged = () => fetchSidebarData(1);
    window.addEventListener(NOTES_CHANGED_EVENT, handleNotesChanged);
    return () => {
      window.removeEventListener(NOTES_CHANGED_EVENT, handleNotesChanged);
    };
  }, [fetchSidebarData]);

  /**
   * 노트 선택 → URL 변경
   */
  const handleSelectNote = (noteId: string) => {
    if (!noteId || noteId.startsWith('temp-')) return;
    navigate(`/notes/${noteId}`);
  };

  /**
   * 즐겨찾기 토글
   */
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
    } catch {
      // rollback
      setFavoriteNoteIds(prev => {
        const next = new Set(prev);
        isFavorite ? next.add(noteId) : next.delete(noteId);
        return next;
      });
    }
  };

  /**
   * 노트 제목 수정
   */
  const handleRenameNote = (noteId: string) => {
    setEditingNoteId(noteId);
  };

  const handleConfirmRename = async (
    noteId: string,
    newTitle: string
  ) => {
    if (!newTitle.trim()) {
      setEditingNoteId(null);
      return;
    }

    const target = notes.find(n => n.noteId === noteId);
    if (!target) {
      setEditingNoteId(null);
      return;
    }

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
      emitNotesChanged();
    } catch {
      emitNotesChanged();
    }
  };

  const handleCancelRename = () => {
    setEditingNoteId(null);
  };

  /**
   * 노트 생성
   */
  const handleCreateNote = async (directoryPath: string) => {
    const tempNote: NoteListItem = {
      memberId: 'temp-user',
      noteId: `temp-${Date.now()}`,
      title: '새 노트',
      directoryPath,
      pointX: 0,
      pointY: 0,
      role: 'OWNER',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setNotes(prev => [...prev, tempNote]);

    try {
      await createNoteApi({
        title: '새 노트',
        invitationUrl: '',
        directoryPath,
      });
      emitNotesChanged();
    } catch {
      setNotes(prev => prev.filter(n => n.noteId !== tempNote.noteId));
    }
  };

  /**
   * 노트 삭제
   */
  const handleDeleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.noteId !== noteId));
    try {
      await deleteNoteApi(noteId);
      emitNotesChanged();
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
                onCancelRename={handleCancelRename}
              />

              {/* 무한 스크롤 트리거 & 로딩 표시 */}
              <div ref={observerTarget} className="sidebar-load-more">
                {isFetchingMore && <div className="spinner-small" />}
              </div>
            </div>
          )}
        </div>
      </aside>

      <button
        className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        {isOpen ? '⟨' : '⟩'}
      </button>

      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu({ visible: false })}
        onDeleteNote={handleDeleteNote}
        onCreateNote={handleCreateNote}
        onRenameNote={handleRenameNote}
        onMoveNote={(noteId, directoryPath) => {
          if (editingNoteId) return;
          setMoveModal({
            open: true,
            noteId,
            currentPath: directoryPath,
          });
        }}
      />

      {moveModal.open && (
        <MoveNoteModal
          isOpen
          currentPath={moveModal.currentPath}
          onCancel={() =>
            setMoveModal({
              open: false,
              noteId: null,
              currentPath: '',
            })
          }
          onConfirm={async (newPath) => {
            if (!moveModal.noteId) return;

            const normalizedPath = normalizeDirectoryPath(newPath);

            const target = notes.find(
              n => n.noteId === moveModal.noteId
            );

            if (!target) {
              console.error('[MOVE] target note not found');
              return;
            }

            try {
              await updateNoteApi(moveModal.noteId, {
                title: target.title,
                directoryPath: normalizedPath,
              });
              emitNotesChanged();
            } catch {
              emitNotesChanged(); // 실패 시 서버 기준 복구
            } finally {
              setMoveModal({
                open: false,
                noteId: null,
                currentPath: '',
              });
            }
          }}
        />
      )}
    </div>
  );
};
