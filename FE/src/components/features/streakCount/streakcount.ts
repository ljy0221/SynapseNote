/**
 * 연속 streak 일수 계산
 * @param activityDates ['YYYY-MM-DD']
 * @returns number (연속 일수)
 */
export function calculateStreakCount(activityDates: string[]): number {
  if (!activityDates.length) return 0;

  const activitySet = new Set(activityDates);

  const today = new Date();
  let streak = 0;

  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - streak);

    const key = formatDate(d);

    if (!activitySet.has(key)) break;
    streak++;
  }

  return streak;
}

/** 로컬 기준 날짜 포맷 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
