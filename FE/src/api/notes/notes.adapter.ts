// src/api/notes/notes.adapter.ts
import type { GetNotesResponse, NoteListItem } from '../../types/note/getNotes';

export const adaptNotesForSidebar = (
  res: GetNotesResponse
): NoteListItem[] => {
  return res.notes;
};
