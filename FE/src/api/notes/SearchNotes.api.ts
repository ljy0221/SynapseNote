// src/api/notes/SearchNotes.api.ts
import { request } from '../request';
import type { SearchNotesResponse } from '../../types/note/SearchNotes';

export const searchNotesApi = (params: {
  keyword: string;
  filter?: 'OWNED' | 'SHARED' | 'ALL';
}): Promise<SearchNotesResponse> => {
  return request<SearchNotesResponse>(
    'get',
    '/v1/notes/search',
    { params }
  );
};
