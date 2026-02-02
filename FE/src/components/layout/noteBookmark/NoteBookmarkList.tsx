import { useEffect, useState } from 'react';
import NoteBookmarkItem from './NoteBookmarkItem';

import type { BookmarkedNote } from '../../../types/bookmark/Bookmark';

import {
  getBookmarksApi,
  removeBookmarkApi,
} from '../../../api/bookmark/Bookmarks.api';
import { adaptBookmarkedNotes } from '../../../api/bookmark/Bookmarks.adapter';

const NoteBookmarkList = () => {
  const [notes, setNotes] = useState<BookmarkedNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const res = await getBookmarksApi();
        setNotes(adaptBookmarkedNotes(res));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemove = async (noteId: string) => {
    // optimistic UI
    setNotes(prev => prev.filter(n => n.noteId !== noteId));

    try {
      await removeBookmarkApi(noteId);
    } catch {
      // rollback: 서버 기준 재동기화
      try {
        const res = await getBookmarksApi();
        setNotes(adaptBookmarkedNotes(res));
      } catch {
        // 여기서는 더 이상 할 수 있는 게 없음 → 조용히 실패
      }
    }
  };

  if (isLoading) {
    return <div className="bookmark-loading">Loading...</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="bookmark-empty">
        즐겨찾기한 노트가 없습니다.
      </div>
    );
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
