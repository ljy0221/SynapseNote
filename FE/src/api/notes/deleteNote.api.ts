// src/api/notes/DeleteNote.api.ts
import { request } from '../request';
import type { DeleteNoteResponse } from '../../types/note/DeleteNote';

export const deleteNoteApi = (
  noteId: string
): Promise<DeleteNoteResponse> => {
  return request<DeleteNoteResponse>(
    'delete',
    `/v1/notes/${noteId}`
  );
};
