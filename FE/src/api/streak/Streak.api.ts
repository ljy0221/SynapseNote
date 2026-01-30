import { request } from '../request';
import type { GetStreakResponse } from '../../types/note/GetStreak';

export const getStreakApi = () => {
  return request<GetStreakResponse>('get', '/v1/streak');
};
