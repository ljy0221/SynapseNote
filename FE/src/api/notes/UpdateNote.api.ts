// src/api/notes/UpdateNote.api.ts
import { request } from '../request';
import type { ApiResponse } from '../../types/common/apiResponse';
import type {
  UpdateNoteRequest,
  UpdateNoteResponse,
} from '../../types/note/UpdateNote';

export const updateNoteApi = (
  noteId: string,
  body: UpdateNoteRequest
): Promise<ApiResponse<UpdateNoteResponse>> => {
  return request<ApiResponse<UpdateNoteResponse>>(
    'put',
    `/v1/notes/${noteId}`,
    { body }
  );
};
