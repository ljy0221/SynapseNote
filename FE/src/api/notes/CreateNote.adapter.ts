import type { CreateNoteResponse } from '../../types/note/CreateNote';
import type { NoteListItem } from '../../types/note/GetNotes';

/**
 * createNote API 응답을 Sidebar에서 사용하는 NoteListItem으로 변환
 */
export const adaptCreatedNoteForSidebar = (
  res: CreateNoteResponse
): NoteListItem => {
  return res.data;
};
 