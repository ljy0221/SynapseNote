// src/api/streak/Streak.adapter.ts
import type { GetStreakResponse } from '../../types/note/GetStreak';

export const adaptStreakDates = (
  res: GetStreakResponse
): string[] => {
  // res.data가 배열이 아닐 경우를 대비해 안전하게 접근
  const data = Array.isArray(res.data) ? res.data : (res as any).data?.data || [];

  if (!Array.isArray(data)) return [];

  return data
    .filter(day => day.isStreak)
    .map(day => day.date)
    .sort();
};
