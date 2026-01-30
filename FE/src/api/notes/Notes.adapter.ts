// src/api/notes/Notes.adapter.ts
// import type { ApiResponse } from '../../types/common/apiResponse';
import type { GetNotesResponse, NoteListItem } from '../../types/note/GetNotes';

export const adaptRecentNotes = (
  res: GetNotesResponse,
  limit = 5
): NoteListItem[] => {
  return res.content.slice(0, limit);
};

export const adaptNotesForSidebar = (
  res: GetNotesResponse
): NoteListItem[] => {
  return res.content;
};
