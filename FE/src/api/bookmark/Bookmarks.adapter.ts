// src/api/notes/Bookmarks.adapter.ts
import type { ApiResponse } from '../../types/common/apiResponse';
import type { BookmarkedNote } from '../../types/bookmark/Bookmark';

export const adaptBookmarkIds = (
  res: ApiResponse<BookmarkedNote[]>
): Set<string> => {
  return new Set(
    res.data.map(note => note.id)
  );
};
