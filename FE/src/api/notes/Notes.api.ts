// src/api/notes/Notes.api.ts
import { request } from '../request';
import type { GetNotesResponse } from '../../types/note/GetNotes';

export const getNotesApi = (params?: {
  page?: number;
  size?: number;
  filter?: 'OWNED' | 'SHARED' | 'ALL';
}) => {
  return request<GetNotesResponse>('get', '/v1/notes', {
    params,
  });
};

