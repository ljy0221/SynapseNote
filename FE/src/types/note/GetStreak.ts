// src/types/streak/GetStreak.ts
export interface StreakDay {
  date: string;      // YYYY-MM-DD
  isStreak: boolean;
}

export type GetStreakResponse = StreakDay[];
