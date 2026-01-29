import type { CreateNoteResponse } from '../../types/note/createNote';
import type { NoteListItem } from '../../types/note/getNotes';

/**
 * createNote API 응답을 Sidebar에서 사용하는 NoteListItem으로 변환
 */
export const adaptCreatedNoteForSidebar = (
  res: CreateNoteResponse
): NoteListItem => {
  return res.data;
};
