// src/api/ai/AiCodeReview.api.ts

import { request } from '../request';
import type { CodeReviewRequest, CodeReviewResponse } from '../../types/ai/CodeReview';

export const requestCodeReview = (
  noteId: string,
  blockId: string,
  body: CodeReviewRequest
): Promise<CodeReviewResponse> => {
  return request<CodeReviewResponse>(
    'post',
    `/v1/notes/${noteId}/blocks/${blockId}/ai/review`,
    { body }
  );
};

// 기본 요청 옵션 (고정값)
export const DEFAULT_REVIEW_REQUEST: CodeReviewRequest = {
  provider: 'OPENAI',
  focusAreas: ['performance', 'security', 'readability', 'bestPractices'],
  includeContext: false,
};
