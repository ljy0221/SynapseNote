// src/api/notes/Notes.adapter.ts
import type { ApiResponse } from '../../types/common/apiResponse';
import type { GetNotesResponse, NoteListItem } from '../../types/note/GetNotes';

export const adaptNotesForSidebar = (
  res: ApiResponse<GetNotesResponse>
): NoteListItem[] => {
  return res.data.notes;
};
