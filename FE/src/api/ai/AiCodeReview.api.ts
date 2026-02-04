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

// 언어를 포함한 리뷰 요청 생성 함수
export const createReviewRequest = (language: string): CodeReviewRequest => ({
  provider: 'OPENAI',
  focusAreas: ['performance', 'security', 'readability', 'bestPractices'],
  includeContext: false,
  language,
});
