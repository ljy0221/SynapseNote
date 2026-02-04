// src/components/layout/sidebar/Sidebar.tsx
import React, { useEffect, useState, useCallback } from 'react';
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


import { deleteNoteApi } from '../../../api/notes/DeleteNote.api';
import { updateNoteApi } from '../../../api/notes/UpdateNote.api';

import {
  NOTES_CHANGED_EVENT,
  emitNotesChanged,
} from '../../../events/NotesEvents';

import { useNavigate, useParams } from 'react-router-dom';
import { useCreateNote } from '../../../hooks/useCreateNote';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 location 훅 사용
  const { noteId: routeNoteId } = useParams<{ noteId: string }>();
  const activeNoteId = routeNoteId ?? null;

  /* [Mod] 홈 뿐만 아니라 노트 페이지에서도 사이드바 고정 (토글 버튼 숨김) */
  const isFixedOpen = location.pathname.startsWith('/home') || location.pathname.startsWith('/note');

  const [notes, setNotes] = useState<NoteListItem[]>([]);
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
  const fetchAllNotes = useCallback(async () => {
    setIsLoading(true);

    try {
      let page = 1;
      let allNotes: NoteListItem[] = [];

      while (true) {
        const res = await getNotesApi({ page });
        const pageNotes = adaptNotesForSidebar(res);
        allNotes.push(...pageNotes);

        if (res.currentPage >= res.totalPages) break;
        page += 1;
      }

      setNotes(allNotes);

      const bookmarksRes = await getBookmarksApi();
      setFavoriteNoteIds(adaptBookmarkIds(bookmarksRes));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** 최초 로딩 + 외부 변경 이벤트 */
  useEffect(() => {
    fetchAllNotes();

    const handleNotesChanged = (e: any) => {
      if (!(e instanceof CustomEvent)) return;

      const detail = e.detail;

      // 제목만 로컬 업데이트
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

      // 기존 동작
      if (detail?.skipRefetch) return;

      fetchAllNotes();
    };

    window.addEventListener(NOTES_CHANGED_EVENT, handleNotesChanged);
    return () =>
      window.removeEventListener(NOTES_CHANGED_EVENT, handleNotesChanged);
  }, [fetchAllNotes]);


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
      emitNotesChanged({ skipRefetch: true });
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
      emitNotesChanged({ skipRefetch: true });
    } catch {
      emitNotesChanged();
    }
  };

  /** -------------------------
   * 노트 생성 (temp → real)
   -------------------------- */
  const { handleCreateNote: createNote } = useCreateNote();

  const handleCreateNote = async (directoryPath: string) => {
    const tempId = `temp-${Date.now()}`;

    const tempNote: NoteListItem = {
      memberId: 'temp-user',
      noteId: tempId,
      title: '새 노트',
      directoryPath,
      pointX: 0,
      pointY: 0,
      role: 'OWNER',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes(prev => [...prev, tempNote]);
    navigate(`/note/${tempId}`);

    try {
      const res = await createNoteApi({
        title: '새 노트',
        invitationUrl: '',
        directoryPath,
      });

      setNotes(prev =>
        prev.map(n =>
          n.noteId === tempId
            ? ({
              memberId: n.memberId,
              noteId: res.noteId,
              title: res.title,
              directoryPath: res.directoryPath,
              pointX: res.pointX ?? 0,
              pointY: res.pointY ?? 0,
              role: res.role ?? n.role,
              createdAt: new Date(res.createdAt).getTime(),
              updatedAt: new Date(res.updatedAt).getTime(),
            } as NoteListItem)
            : n
        )
      );


      navigate(`/note/${res.noteId}`, { replace: true });
      emitNotesChanged({ skipRefetch: true });
    } catch {
      setNotes(prev => prev.filter(n => n.noteId !== tempId));
    }
  };

  /** -------------------------
   * 노트 삭제
   -------------------------- */
  const handleDeleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.noteId !== noteId));
    try {
      await deleteNoteApi(noteId);
      emitNotesChanged({ skipRefetch: true });
    } catch {
      emitNotesChanged();
    }
  };

  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal');

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
              {activeTab === 'personal' ? (
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
              ) : (
                <div className="sidebar-placeholder">
                  <div className="sidebar-placeholder-icon">
                    <Plus size={32} style={{ transform: 'rotate(45deg)' }} />
                  </div>
                  <p>공유받은 노트가 없습니다.<br />아직 기능 준비 중입니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {!isFixedOpen && (
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

      {moveModal.open && (
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
      )}
    </div>
  );
};
