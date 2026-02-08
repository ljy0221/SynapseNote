import type { ExecutionResult } from '../types/execution/ExecutionTypes';
import { api } from '../api/axios';

// "/v1/notes/{noteId}/blocks/{blockId}/executions"
export async function saveExecutionToBackend(
  noteId: string,
  blockId: string,
  result: ExecutionResult
): Promise<void> {
  try {
    await api.post(`/v1/notes/${noteId}/blocks/${blockId}/executions`, {
      output: result.output,
      executionTimeMs: result.executionTime,
      status: result.status,
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
    const res = await api.get(`/v1/notes/${noteId}/blocks/${blockId}/executions`, {
      params: { page, size },
    });

    // 서버 응답이 DataResponse 형태면 data.data에 실제 값이 있음.
    // 서버가 그냥 배열을 주면 res.data가 배열일 수 있음.
    return res.data?.data ?? res.data ?? [];
  } catch (error) {
    console.error('실행 히스토리 조회 실패:', error);
    return [];
  }
}