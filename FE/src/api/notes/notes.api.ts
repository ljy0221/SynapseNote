// src/api/notes/notes.api.ts
import { request } from '../request';
import type { GetNotesResponse } from '../../types/note/getNotes';

export const getNotesApi = (params?: {
  page?: number;
  size?: number;
}) => {
  return request<GetNotesResponse>('get', '/v1/notes', {
    params,
  });
};
