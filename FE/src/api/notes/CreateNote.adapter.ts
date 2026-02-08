import type { CreateNoteResponse } from '../../types/note/CreateNote';
import type { NoteListItem } from '../../types/note/GetNotes';

/**
 * createNote API 응답을 Sidebar에서 사용하는 NoteListItem으로 변환
 */
export const adaptCreatedNoteForSidebar = (
  res: CreateNoteResponse
): NoteListItem => {
  return {
    ...res,
    // 날짜 형식이 문자열로 오므로 숫자로 변환 (NoteListItem 요구사항)
    createdAt: new Date(res.createdAt).getTime(),
    updatedAt: new Date(res.updatedAt).getTime(),
  };
};
