// src/api/notes/bookmarks.adapter.ts
import type { GetBookmarksResponse } from '../../types/bookmark/getBookmarks';

export const adaptBookmarkIds = (
  res: GetBookmarksResponse
): Set<string> => {
  return new Set(res.notes.map(note => note.noteId));
};
