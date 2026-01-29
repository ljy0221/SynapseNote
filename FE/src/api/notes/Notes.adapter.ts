// src/api/notes/Notes.adapter.ts
import type { GetNotesResponse, NoteListItem } from '../../types/note/GetNotes';

export const adaptNotesForSidebar = (
  res: GetNotesResponse
): NoteListItem[] => {
  return res.notes;
};
 