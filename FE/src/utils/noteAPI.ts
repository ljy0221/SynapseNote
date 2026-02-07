import { searchNotesApi } from '../api/notes/SearchNotes.api';
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

export async function searchNotes(query: string): Promise<SearchedNote[]> {
  try {
    // 1. 내가 소유한 노트 검색 (Server-side Filter)
    const ownedPromise = searchNotesApi({ keyword: query, filter: 'OWNED' });

    // 2. 공유받은 노트 검색 (Server-side Filter)
    const sharedPromise = searchNotesApi({ keyword: query, filter: 'SHARED' });

    const [ownedRes, sharedRes] = await Promise.all([ownedPromise, sharedPromise]);

    // 3. 결과 병합 및 데이터 정제
    const ownedNotes = (ownedRes.data || []).map((note) => ({
      ...note,
      noteId: note.noteId.toLowerCase(),
    }));

    const sharedNotes = (sharedRes.data || []).map((note) => ({
      ...note,
      noteId: note.noteId.toLowerCase(),
      // API 응답에 createdByName이 포함되어 있으므로 그대로 사용
    }));

    // 4. 중복 제거 (ID 기준)
    const mergedNotes = [...ownedNotes];
    const existingIds = new Set(ownedNotes.map((n) => n.noteId));

    sharedNotes.forEach((note) => {
      if (!existingIds.has(note.noteId)) {
        mergedNotes.push(note);
      }
    });

    return mergedNotes;
  } catch (e) {
    console.error('노트 검색 실패 detail:', e);
    throw new Error('노트 검색 실패');
  }
}
