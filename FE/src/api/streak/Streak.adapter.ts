import type { GetStreakResponse } from '../../types/note/GetStreak';

export const adaptStreakDates = (
  res: GetStreakResponse
): string[] => {
  return res.dates;
};
