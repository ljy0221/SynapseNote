// src/api/notes/CreateNote.api.ts
import { request } from '../request';
import type {
  CreateNoteRequest,
  CreateNoteResponse,
} from '../../types/note/CreateNote';

export const createNoteApi = (
  body: CreateNoteRequest
): Promise<CreateNoteResponse> => {
  return request<CreateNoteResponse>('post', '/v1/notes', {
    body,
  });
};
 