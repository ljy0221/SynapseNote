// src/components/home/NoteStreak.tsx
import React,{ useMemo } from 'react';
import './NoteStreak.css';
import { calculateStreakCount } from '../../features/streakCount/streakcount';
import type { GetStreakResponse } from '../../../types/note/getStreak';

interface NoteStreakProps {
  streak: GetStreakResponse;
}

/** 로컬 기준 날짜 포맷 */
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DAYS = 180;

const NoteStreak: React.FC<NoteStreakProps> = ({ streak }) => {
  const activityDates = streak.dates;

  const activitySet = new Set(activityDates);
  const today = new Date();

  const streakCount = useMemo(
    () => calculateStreakCount(activityDates),
    [activityDates]
  );

  /** 최근 180일 날짜 생성 */
  const days: Date[] = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return d;
  });

  /** 주(week) 단위로 묶기 */
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach(date => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length) weeks.push(currentWeek);

  /** 월 라벨 계산 (월이 바뀌는 주의 첫 번째 열) */
  const monthLabels = weeks.map((week, index) => {
    const firstDay = week[0];
    if (firstDay.getDate() <= 7) {
      return {
        index,
        label: `${firstDay.getMonth() + 1}월`,
      };
    }
    return null;
  }).filter(Boolean) as { index: number; label: string }[];

  return (
    <section className="note-streak">
      <div className="streak-header">
        <h3>Streak</h3>

        {streakCount >= 0 && (
          <span className="streak-count">
            🔥 {streakCount}일 연속
          </span>
        )}
      </div>


      {/* 월 라벨 */}
      <div className="streak-months">
        {monthLabels.map(m => (
          <span
            key={m.index}
            className="month-label"
            style={{ gridColumnStart: m.index + 1 }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* GitHub 스타일 스트릭 */}
      <div className="streak-grid">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="week-column">
            {week.map(date => {
              const key = formatDate(date);
              const active = activitySet.has(key);

              return (
                <div
                  key={key}
                  className={`day-cell ${active ? 'active' : ''}`}
                  title={key}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};

export default NoteStreak;
