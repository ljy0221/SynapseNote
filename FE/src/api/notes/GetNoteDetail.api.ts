// src/api/notes/GetNoteDetail.api.ts
import { request } from '../request';
import type { ApiResponse } from '../../types/common/apiResponse';
import type { GetNoteDetailResponse } from '../../types/note/GetNoteDetail';

export const getNoteDetailApi = (
  noteId: string
): Promise<ApiResponse<GetNoteDetailResponse>> => {
  return request<ApiResponse<GetNoteDetailResponse>>(
    'get',
    `/v1/notes/${noteId}`
  );
};
