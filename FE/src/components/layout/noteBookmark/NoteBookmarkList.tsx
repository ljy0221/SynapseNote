import { useEffect, useState } from 'react';
import NoteBookmarkItem from './NoteBookmarkItem';

import type { BookmarkedNote } from '../../../types/bookmark/Bookmark';

import { getBookmarksApi } from '../../../api/bookmark/Bookmarks.api';
import {
  adaptBookmarkedNotes,
} from '../../../api/bookmark/Bookmarks.adapter';
import { removeBookmarkApi } from '../../../api/bookmark/Bookmarks.api';



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

  const handleRemove = async (noteId: string) => {
    // 1. optimistic UI
    setNotes(prev => prev.filter(n => n.noteId !== noteId));

    console.log(
      '[NoteBookmarkList] 즐겨찾기 제거 (optimistic)',
      { noteId }
    );

    try {
      await removeBookmarkApi(noteId);

      console.log(
        '[NoteBookmarkList] 즐겨찾기 제거 성공',
        { noteId }
      );
    } catch (e) {
      console.error(
        '[NoteBookmarkList] 즐겨찾기 제거 실패',
        e
      );

      // ❌ rollback (다시 불러오는 게 가장 안전)
      try {
        const res = await getBookmarksApi();
        setNotes(adaptBookmarkedNotes(res));
      } catch (reloadError) {
        console.error(
          '[NoteBookmarkList] 즐겨찾기 재동기화 실패',
          reloadError
        );
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
