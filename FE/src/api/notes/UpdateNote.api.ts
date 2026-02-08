// src/api/notes/UpdateNote.api.ts
import { request } from '../request';
import type {
  UpdateNoteRequest,
  UpdateNoteResponse,
} from '../../types/note/UpdateNote';

export const updateNoteApi = (
  noteId: string,
  body: UpdateNoteRequest
): Promise<UpdateNoteResponse> => {
  return request<UpdateNoteResponse>(
    'put',
    `/v1/notes/${noteId}`,
    { body }
  );
};
