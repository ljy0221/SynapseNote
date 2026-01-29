// src/api/notes/createNote.api.ts
import { request } from '../request';
import type {
  CreateNoteRequest,
  CreateNoteResponse,
} from '../../types/note/createNote';

export const createNoteApi = (
  body: CreateNoteRequest
): Promise<CreateNoteResponse> => {
  return request<CreateNoteResponse>('post', '/v1/notes', {
    body,
  });
};
