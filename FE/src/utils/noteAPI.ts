// FE/src/utils/noteAPI.ts
import type { CreateNoteRequest, CreateNoteResponse } from '../types/note/createNote'; // 경로 확인 필요
export async function createNote(req: CreateNoteRequest): Promise<CreateNoteResponse> {
    const authToken = localStorage.getItem('authToken');
    // 토큰이 절대적으로 필요하다면 에러 처리, 선택적이라면 로직 조정
    // if (!authToken) throw new Error('로그인이 필요합니다.');
    const response = await fetch('/api/v1/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || ''}`,
        },
        body: JSON.stringify(req),
    });
    if (!response.ok) {
        throw new Error('노트 생성 실패');
    }
    return await response.json();
}