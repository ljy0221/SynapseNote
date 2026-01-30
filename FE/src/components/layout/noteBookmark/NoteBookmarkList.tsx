import { useState } from 'react';
import NoteBookmarkItem from './NoteBookmarkItem';
import type { BookmarkNoteItem } from '../../../types/bookmark/GetBookmarks';

const initialMock: BookmarkNoteItem[] = [
  {
    noteId: 'n1',
    title: '이진 탐색',
    directoryPath: '/알고리즘/탐색',
    role: 'OWNER',
    favoritedAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-26T09:00:00Z',
  },
  {
    noteId: 'n2',
    title: '이진 탐색',
    directoryPath: '/알고리즘/탐색',
    role: 'OWNER',
    favoritedAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-26T09:00:00Z',
  },
  {
    noteId: 'n3',
    title: '이진 탐색',
    directoryPath: '/알고리즘/탐색',
    role: 'OWNER',
    favoritedAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-26T09:00:00Z',
  },
  {
    noteId: 'n4',
    title: '이진 탐색',
    directoryPath: '/알고리즘/탐색',
    role: 'OWNER',
    favoritedAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-26T09:00:00Z',
  },
];

const NoteBookmarkList = () => {
  const [notes, setNotes] = useState(initialMock);

  const handleRemove = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.noteId !== noteId));
    // TODO: API 연결 (optimistic UI)
  };

  if (notes.length === 0) {
    return <div className="bookmark-empty">즐겨찾기한 노트가 없습니다.</div>;
  }

  return (
    <ul className="note-bookmark-list">
      {notes.map(note => (
        <NoteBookmarkItem
          key={note.noteId}
          note={note}
          onRemove={handleRemove}
        />
      ))}
    </ul>
  );
};

export default NoteBookmarkList;
