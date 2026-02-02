import { request } from '../request';
import type { GetStreakResponse } from '../../types/note/GetStreak';

// src/api/streak/Streak.api.ts
export const getStreakApi = (memberId: string) => {
  return request<GetStreakResponse>(
    'get',
    `/v1/members/${memberId}/streak`
  );
};
