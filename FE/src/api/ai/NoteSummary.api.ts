import { request } from '../request';
import type { NoteSummaryRequest, NoteSummaryResponse } from '../../types/ai/NoteSummary';

export const summarizeNoteApi = (
  noteId: string,
  body: NoteSummaryRequest
): Promise<NoteSummaryResponse> => {
  return request<NoteSummaryResponse>('post', `/v1/notes/${noteId}/ai/summary`, { body });
};
