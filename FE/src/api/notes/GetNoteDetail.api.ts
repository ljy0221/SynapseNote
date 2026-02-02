// src/api/notes/GetNoteDetail.api.ts
import { request } from '../request';
import type { GetNoteDetailResponse } from '../../types/note/GetNoteDetail';

export const getNoteDetailApi = (
  noteId: string
): Promise<GetNoteDetailResponse> => {
  return request<GetNoteDetailResponse>(
    'get',
    `/v1/notes/${noteId}`
  );
};
