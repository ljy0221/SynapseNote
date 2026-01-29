// src/api/notes/UpdateNotePosition.api.ts
import { request } from '../request';
import type { ApiResponse } from '../../types/common/apiResponse';
import type {
  UpdateNotePositionRequest,
  UpdateNotePositionResponse,
} from '../../types/note/UpdateNotePosition';

export const updateNotePositionApi = (
  noteId: string,
  body: UpdateNotePositionRequest
): Promise<ApiResponse<UpdateNotePositionResponse>> => {
  return request<ApiResponse<UpdateNotePositionResponse>>(
    'put',
    `/v1/notes/${noteId}/position`,
    { body }
  );
};
