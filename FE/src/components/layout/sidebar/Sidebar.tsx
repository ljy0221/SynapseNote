// src/components/layout/sidebar/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import './Sidebar.css';

import type { NoteListItem } from '../../../types/note/GetNotes';
import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';

import ContextMenu from '../../common/contextMenu/ContextMenu';
import type { ContextMenuState } from '../../../types/sidebar/ContextMenu';

import { getNotesApi } from '../../../api/notes/Notes.api';
import { adaptNotesForSidebar } from '../../../api/notes/Notes.adapter';

import { getBookmarksApi } from '../../../api/bookmark/Bookmarks.api';
import { adaptBookmarkIds } from '../../../api/bookmark/Bookmarks.adapter';

import { createNoteApi } from '../../../api/notes/CreateNote.api';
import { deleteNoteApi } from '../../../api/notes/DeleteNote.api';

import {
  NOTES_CHANGED_EVENT,
  emitNotesChanged,
} from '../../../events/NotesEvents';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [favoriteNoteIds, setFavoriteNoteIds] =
    useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [activeNoteId, setActiveNoteId] =
    useState<string | null>(null);
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState>({ visible: false });

  const noteTree = buildNoteTree(notes ?? []);

  /**
   * Sidebar 단일 진실 소스
   * - 최초 로딩
   * - notes:changed 이벤트 수신 시
   */
  const fetchSidebarData = async () => {
    setIsLoading(true);
    try {
      const [notesRes, bookmarksRes] = await Promise.all([
        getNotesApi(),
        getBookmarksApi(),
      ]);

      setNotes(adaptNotesForSidebar(notesRes));
      setFavoriteNoteIds(adaptBookmarkIds(bookmarksRes));
    } catch (e) {
      console.error('Sidebar 데이터 로딩 실패', e);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 최초 로딩 + 이벤트 구독
   */
  useEffect(() => {
    fetchSidebarData();

    window.addEventListener(NOTES_CHANGED_EVENT, fetchSidebarData);
    return () => {
      window.removeEventListener(
        NOTES_CHANGED_EVENT,
        fetchSidebarData
      );
    };
  }, []);

  /**
   * 즐겨찾기 토글 (UI 전용)
   */
  const handleToggleFavorite = (noteId: string) => {
    setFavoriteNoteIds(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  };

  /**
   * 노트 생성
   * - Optimistic Update
   * - 서버 성공 후 전체 재동기화
   */
  const handleCreateNote = async (directoryPath: string) => {
    const tempNote: NoteListItem = {
      noteId: `temp-${Date.now()}`,
      title: '새 노트',
      directoryPath,
      pointX: 0,
      pointY: 0,
      role: 'OWNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 🔹 즉시 UI 반영
    setNotes(prev => [...prev, tempNote]);

    try {
      await createNoteApi({
        title: '새 노트',
        invitationUrl: '',
        directoryPath,
      });

      // 🔹 서버 기준으로 재동기화
      emitNotesChanged();
    } catch (e) {
      // ❌ 실패 시 롤백
      setNotes(prev =>
        prev.filter(n => n.noteId !== tempNote.noteId)
      );
      console.error('노트 생성 실패', e);
    }
  };

  /**
   * 노트 삭제
   * - Optimistic Update
   * - 실패 시 서버 기준으로 복구
   */
  const handleDeleteNote = async (noteId: string) => {
    // 🔹 즉시 UI 반영
    setNotes(prev => prev.filter(n => n.noteId !== noteId));
    setActiveNoteId(prev =>
      prev === noteId ? null : prev
    );

    try {
      await deleteNoteApi(noteId);
      emitNotesChanged();
    } catch (e) {
      console.error('노트 삭제 실패', e);
      // ❌ 실패 시 서버 기준 복구
      emitNotesChanged();
    }
  };

  return (
    <div className="sidebar-wrapper">
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {isLoading ? (
            <div className="sidebar-loading">Loading...</div>
          ) : (
            <NoteDirectory
              node={noteTree}
              activeNoteId={activeNoteId}
              favoriteNoteIds={favoriteNoteIds}
              onSelectNote={setActiveNoteId}
              onToggleFavorite={handleToggleFavorite}
              onContextMenu={setContextMenu}
            />
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
      />
    </div>
  );
};
