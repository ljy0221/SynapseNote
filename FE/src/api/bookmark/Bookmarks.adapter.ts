import type {
  GetBookmarksResponse,
} from '../../types/bookmark/BookmarkResponse';
import type { BookmarkedNote } from '../../types/bookmark/Bookmark';

/**
 * ✔ 북마크 목록 렌더링용
 */
export const adaptBookmarkedNotes = (
  res: GetBookmarksResponse
): BookmarkedNote[] => {
  return res.content;
};

/**
 * ✔ 즐겨찾기 여부 판단용 (기존 유지)
 */
export const adaptBookmarkIds = (
  res: GetBookmarksResponse
): Set<string> => {
  return new Set(res.content.map(note => note.noteId));
};
