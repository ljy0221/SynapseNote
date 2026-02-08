import { getNotesApi } from '../api/notes/Notes.api';
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
    // 1. 기존 검색 API 호출 (내가 만든 노트 검색)
    // 일부 백엔드는 filter='ALL'이 동작하지 않을 수 있음
    const searchPromise = api.get('/v1/notes/search', {
      params: { q: query },
    });

    // 2. 공유 노트 직접 조회 후 필터링 (Fallback)
    // 백엔드 검색 API가 공유 노트를 제대로 반환하지 않는 경우를 대비
    const sharedPromise = getNotesApi({
      filter: 'SHARED',
      size: 100, // 충분히 큰 수로 조회 (페이지네이션 미적용 한계 있음)
    });

    const [searchRes, sharedRes] = await Promise.all([searchPromise, sharedPromise]);

    // 3. 검색 결과 (Owned Note 위주)
    const searchData = (searchRes.data?.data ?? searchRes.data) as SearchedNote[];
    const ownedNotes = searchData.map((note: SearchedNote) => ({
      ...note,
      noteId: note.noteId.toLowerCase(),
    }));

    // 4. 공유 노트 필터링
    const sharedNotes = sharedRes.content
      .filter(note => note.title.toLowerCase().includes(query.toLowerCase()))
      .map(note => ({
        noteId: note.noteId.toLowerCase(),
        title: note.title,
        directoryPath: note.directoryPath,
        pointX: note.pointX,
        pointY: note.pointY,
        createdBy: note.memberId, // NoteListItem의 memberId는 소유자(Creator) ID
        createdByName: '', // NoteListItem에는 없으므로 빈 문자열 (UI 사용 시 주의)
        createdAt: new Date(note.createdAt).toISOString(), // number -> ISO string
        updatedAt: new Date(note.updatedAt).toISOString(),
        /* 타입 불일치 해결을 위해 캐스팅 */
      } as SearchedNote));

    // 5. 결과 병합 (중복 제거 - ID 기준)
    const mergedNotes = [...ownedNotes];
    const existingIds = new Set(ownedNotes.map(n => n.noteId));

    sharedNotes.forEach(note => {
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