import { useEffect, useState } from 'react';
import NoteBookmarkItem from './NoteBookmarkItem';

import type { BookmarkedNote } from '../../../types/bookmark/Bookmark';

import { getBookmarksApi } from '../../../api/bookmark/Bookmarks.api';
import {
  adaptBookmarkedNotes,
} from '../../../api/bookmark/Bookmarks.adapter';

const NoteBookmarkList = () => {
  const [notes, setNotes] = useState<BookmarkedNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const res = await getBookmarksApi();
        const bookmarkedNotes = adaptBookmarkedNotes(res);

        setNotes(bookmarkedNotes);

        // ✅ 성공 로그 (개발용)
        console.log(
          '[NoteBookmarkList] 즐겨찾기 로딩 성공',
          {
            count: bookmarkedNotes.length,
            notes: bookmarkedNotes,
          }
        );
      } catch (e) {
        console.error('[NoteBookmarkList] 즐겨찾기 로딩 실패', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemove = (noteId: string) => {
    // optimistic UI
    setNotes(prev => prev.filter(n => n.id !== noteId));

    console.log(
      '[NoteBookmarkList] 즐겨찾기 제거 (optimistic)',
      { noteId }
    );

    // TODO: removeBookmarkApi(noteId)
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
          key={note.id}
          note={note}
          onRemove={handleRemove}
        />
      ))}
    </ul>
  );
};

export default NoteBookmarkList;
