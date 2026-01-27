import type { ExecutionResult } from '../types/execution/ExecutionTypes';

export async function saveExecutionToBackend(
  noteId: string,
  blockId: string,
  result: ExecutionResult
): Promise<void> {
  try {
    const authToken = getAuthToken();
    if (!authToken) {
      console.warn('인증 토큰이 없어 실행 히스토리를 저장하지 않습니다.');
      return;
    }

    await fetch(`/api/v1/notes/${noteId}/blocks/${blockId}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        output: result.output,
        executionTimeMs: result.executionTime,
        status: result.status,
      }),
    });
  } catch (error) {
    console.error('실행 히스토리 저장 실패:', error);
    // 실패해도 사용자 경험에는 영향 없음 (백그라운드 저장)
  }
}

export async function getExecutionHistory(
  noteId: string,
  blockId: string,
  page: number = 0,
  size: number = 10
): Promise<any[]> {
  try {
    const authToken = getAuthToken();
    if (!authToken) {
      return [];
    }

    const response = await fetch(
      `/api/v1/notes/${noteId}/blocks/${blockId}/executions?page=${page}&size=${size}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('히스토리 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('실행 히스토리 조회 실패:', error);
    return [];
  }
}

function getAuthToken(): string | null {
  // localStorage에서 JWT 토큰 가져오기
  return localStorage.getItem('authToken');
}
