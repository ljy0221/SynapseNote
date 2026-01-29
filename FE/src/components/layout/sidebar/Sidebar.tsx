// src/components/layout/sidebar/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import './Sidebar.css';

import type { NoteListItem } from '../../../types/note/getNotes';
import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';
import ContextMenu from '../../common/contextMenu/ContextMenu';
import { ContextMenuState } from '../../../types/sidebar/contextMenu';

import { getNotesApi } from '../../../api/notes/notes.api';
import { adaptNotesForSidebar } from '../../../api/notes/notes.adapter';

import { getBookmarksApi } from '../../../api/notes/bookmarks.api';
import { adaptBookmarkIds } from '../../../api/notes/bookmarks.adapter';

import { createNoteApi } from '../../../api/notes/createNote.api';
import { deleteNoteApi } from '../../../api/notes/deleteNote.api';

import { adaptCreatedNoteForSidebar } from '../../../api/notes/createNote.adapter';
import { adaptDeletedNoteId } from '../../../api/notes/deleteNote.adapter';

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

  const noteTree = buildNoteTree(notes);

  useEffect(() => {
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

    fetchSidebarData();
  }, []);

  /** 즐겨찾기 (UI 전용, API는 아직 X) */
  const handleToggleFavorite = (noteId: string) => {
    setFavoriteNoteIds(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  };

  /** 노트 생성 */
  const handleCreateNote = async (directoryPath: string) => {
    try {
      const res = await createNoteApi({
        title: '새 노트',
        invitationUrl: '',
        directoryPath,
      });

      const newNote = adaptCreatedNoteForSidebar(res);
      setNotes(prev => [...prev, newNote]);
    } catch (e) {
      console.error('노트 생성 실패', e);
    }
  };

  /** 노트 삭제 */
  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await deleteNoteApi(noteId);
      const deletedNoteId = adaptDeletedNoteId(res);

      setNotes(prev =>
        prev.filter(n => n.noteId !== deletedNoteId)
      );
      setActiveNoteId(prev =>
        prev === deletedNoteId ? null : prev
      );
    } catch (e) {
      console.error('노트 삭제 실패', e);
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
