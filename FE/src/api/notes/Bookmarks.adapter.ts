// src/api/notes/Bookmarks.adapter.ts
import type { GetBookmarksResponse } from '../../types/bookmark/GetBookmarks';

export const adaptBookmarkIds = (
  res: GetBookmarksResponse
): Set<string> => {
  return new Set(res.notes.map(note => note.noteId));
};