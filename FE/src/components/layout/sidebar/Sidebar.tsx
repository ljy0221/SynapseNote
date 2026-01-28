// src/components/layout/sidebar/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import './Sidebar.css';

import type { NoteListItem } from '../../../types/note/getNotes';
import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';
import ContextMenu from '../../common/contextMenu/ContextMenu';
import { ContextMenuState } from '../../../types/sidebar/contextMenu';

import { getNotes } from '../../../api/notes/getNotes';
import { getBookmarkedNotes } from '../../../api/notes/getBookmarks';
import { createNote } from '../../../api/notes/createNote';
import { deleteNote } from '../../../api/notes/deleteNote';

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
        const [notesRes, bookmarkedIds] = await Promise.all([
          getNotes(),
          getBookmarkedNotes(),
        ]);
        setNotes(notesRes);
        setFavoriteNoteIds(new Set(bookmarkedIds));
      } catch (e) {
        console.error('Sidebar 데이터 로딩 실패', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSidebarData();
  }, []);

  const handleToggleFavorite = (noteId: string) => {
    setFavoriteNoteIds(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  };

  const handleCreateNote = async (directoryPath: string) => {
    try {
      const newNote = await createNote({
        title: '새 노트',
        directoryPath,
      });
      setNotes(prev => [...prev, newNote]);
    } catch (e) {
      console.error('노트 생성 실패', e);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.noteId !== noteId));
      setActiveNoteId(prev => (prev === noteId ? null : prev));
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
