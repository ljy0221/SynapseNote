// FE/src/utils/noteAPI.ts
import type { CreateNoteRequest, CreateNoteResponse } from '../types/note/CreateNote';
import type { SearchedNote } from '../types/note/SearchNotes';
import { api } from '../api/axios';

export async function createNote(req: CreateNoteRequest): Promise<CreateNoteResponse> {
  try {
    // baseURL '/api' + path '/v1/notes' => '/api/v1/notes'
    const res = await api.post('/v1/notes', req);

    // 서버가 DataResponse 래핑이면 res.data.data가 실제 payload
    // 래핑이 아니면 res.data 자체가 payload
    return (res.data?.data ?? res.data) as CreateNoteResponse;
  } catch (e) {
    throw new Error('노트 생성 실패');
  }
}

/**
 * 노트 검색 API
 * BE: GET /api/v1/notes/search?q={query}
 */
export async function searchNotes(query: string): Promise<SearchedNote[]> {
  try {
    const res = await api.get('/v1/notes/search', {
      params: { q: query },
    });

    const data = (res.data?.data ?? res.data) as SearchedNote[];

    // 기존 로직 유지
    return data.map((note: SearchedNote) => ({
      ...note,
      noteId: note.noteId.toLowerCase(),
    }));
  } catch (e) {
    throw new Error('노트 검색 실패');
  }
}