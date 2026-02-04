import { useEffect, useState, useCallback } from 'react';
import { BookDashed } from 'lucide-react';
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

  const fetchBookmarks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await getBookmarksApi();
      setNotes(adaptBookmarkedNotes(res));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  useEffect(() => {
    const handleChanged = () => {
      fetchBookmarks(true); // 즐겨찾기 변경 시에도 조용히 갱신
    };

    window.addEventListener('notes-changed', handleChanged);
    return () => window.removeEventListener('notes-changed', handleChanged);
  }, [fetchBookmarks]);

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
        <BookDashed size={48} className="bookmark-empty-icon" />
        <span className="empty-text">아직 즐겨찾기한 지식이 없습니다!</span>
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
