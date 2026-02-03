// src/api/ai/AiCodeReview.api.ts

import { api } from '../axios';
import type { ApiResponse } from '../../types/common/apiResponse';
import type { CodeReviewRequest, CodeReviewResponse } from '../../types/ai/CodeReview';

// AbortController signal 지원 추가
export const requestCodeReview = async (
  noteId: string,
  blockId: string,
  body: CodeReviewRequest,
  signal?: AbortSignal
): Promise<CodeReviewResponse> => {
  const res = await api.request<ApiResponse<CodeReviewResponse>>({
    method: 'post',
    url: `/v1/notes/${noteId}/blocks/${blockId}/ai/review`,
    data: body,
    signal,
  });
  return res.data.data;
};

// 기본 요청 옵션 (고정값)
export const DEFAULT_REVIEW_REQUEST: CodeReviewRequest = {
  provider: 'OPENAI',
  focusAreas: ['performance', 'security', 'readability', 'bestPractices'],
  includeContext: false,
};
