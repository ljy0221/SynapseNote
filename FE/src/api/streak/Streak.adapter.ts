// src/api/streak/Streak.adapter.ts
import type { GetStreakResponse } from '../../types/note/GetStreak';

export const adaptStreakDates = (
  res: GetStreakResponse
): string[] => {
  const data = res || [];
  return data
    .filter(day => day.isStreak)
    .map(day => day.date)
    .sort();
};
