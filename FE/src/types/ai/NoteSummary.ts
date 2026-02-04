export type SummaryStyle = 'concise' | 'detailed' | 'bullet-points';
export type AiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI';

export interface NoteSummaryRequest {
  provider?: AiProvider;
  style?: SummaryStyle;
  maxLength?: number;
}

export interface NoteSummaryResponse {
  noteId: string;
  summary: string;
  style: string;
  codeBlockCount: number;
  languages: string[];
  createdAt: string;
}
