import { useEffect, useState } from 'react';
import NoteBookmarkItem from './NoteBookmarkItem';

import type { BookmarkedNote } from '../../../types/bookmark/Bookmark';

import { getBookmarksApi } from '../../../api/bookmark/Bookmarks.api';
import { adaptBookmarkIds } from '../../../api/bookmark/Bookmarks.adapter';

const NoteBookmarkList = () => {
  const [notes, setNotes] = useState<BookmarkedNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const res = await getBookmarksApi();
        const adapted = adaptBookmarkIds(res);
        setNotes(prev => prev.filter(n => adapted.has(n.id)));
      } catch (e) {
        console.error('즐겨찾기 로딩 실패', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemove = (noteId: string) => {
    // optimistic UI
    setNotes(prev => prev.filter(n => n.id !== noteId));

    // TODO: removeBookmarkApi(noteId)
    // .catch(() => rollback)
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
