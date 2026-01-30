// src/api/bookmark/Bookmarks.adapter.ts
import { GetBookmarksResponse } from '../../types/bookmark/BookmarkResponse';

export const adaptBookmarkIds = (
  res: GetBookmarksResponse
): Set<string> => {
  return new Set(
    res.content.map(note => note.id)
  );
};
