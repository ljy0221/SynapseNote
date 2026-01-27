import { ExecutionResult } from '../types/execution/ExecutionTypes';

// 백엔드 API 엔드포인트 설정 (환경 변수 또는 실제 주소로 변경 필요)
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 코드 실행 결과를 백엔드에 저장합니다.
 */
export const saveExecutionToBackend = async (
    noteId: string,
    blockId: string,
    result: ExecutionResult
): Promise<void> => {
    try {
        // 실제 백엔드 API 명세에 맞춰 URL과 데이터 구조를 수정해야 할 수 있습니다.
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}/blocks/${blockId}/execution`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(result),
        });

        if (!response.ok) {
            // 저장은 실패해도 사용자에게 치명적이지 않으므로 경고만 로그
            console.warn(`[ExecutionAPI] Failed to save history: ${response.statusText}`);
        }
    } catch (error) {
        console.error('[ExecutionAPI] Error saving execution history:', error);
    }
};
