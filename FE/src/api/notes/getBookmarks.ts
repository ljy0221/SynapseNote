import axios from 'axios';
import type { GetBookmarksResponse } from '../../types/bookmark/getBookmarks';

export const getBookmarkedNotes = async (): Promise<string[]> => {
  const res = await axios.get<GetBookmarksResponse>(
    '/api/v1/notes/bookmarks'
  );

  // 🔥 Sidebar에서는 noteId만 필요
  return res.data.notes.map(note => note.noteId);
};
