// src/types/ai/CodeReview.ts

export type AiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI';

export interface CodeReviewRequest {
  provider: AiProvider;
  focusAreas: string[];
  includeContext: boolean;
}

export interface ReviewItem {
  severity: string;
  category: string;
  issue: string;
  suggestion: string;
  lineNumber: number | null;
}

export interface CodeReviewResponse {
  blockId: string;
  language: string;
  originalCode: string;
  reviews: ReviewItem[];
  bestPractices: string[];
  summary: string;
  reviewedAt: string;
}
