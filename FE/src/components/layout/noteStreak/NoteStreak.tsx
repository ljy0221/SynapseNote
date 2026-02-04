import React, { useMemo } from 'react';
import { Combine } from 'lucide-react';
import './NoteStreak.css';
import { calculateStreakCount } from '../../features/streakCount/streakcount';

// NoteStreak.tsx
interface NoteStreakProps {
  streak: {
    dates: string[]; // streak인 날짜만
  };
}


/** 로컬 기준 날짜 포맷 */
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DAYS = 140;

const NoteStreak: React.FC<NoteStreakProps> = ({ streak }) => {
  const activityDates = streak.dates;

  const activitySet = new Set(activityDates);
  const today = new Date();

  const streakCount = useMemo(
    () => calculateStreakCount(activityDates),
    [activityDates]
  );

  /** 현재 전시할 전시 기간 (약 180일 전부터 이번 주 토요일까지) */
  const days: Date[] = useMemo(() => {
    const end = new Date(today);
    // 이번 주 토요일까지 채우기 (일:0 ~ 토:6)
    const dayOfWeek = today.getDay();
    end.setDate(today.getDate() + (6 - dayOfWeek));

    const result: Date[] = [];
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(end);
      d.setDate(end.getDate() - (DAYS - 1 - i));
      result.push(d);
    }
    return result;
  }, [today]);

  /** 주(week) 단위로 묶기 */
  const weeks: Date[][] = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach(date => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length) result.push(currentWeek);
    return result;
  }, [days]);

  /** 월 라벨 계산 (월이 시작되는 첫 번째 주에 라벨 표시) */
  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      // 해당 주의 어떤 하루라도 이전 달과 다르다면 (그 달의 첫 주라고 판단)
      const hasMonthStart = week.some(d => {
        const m = d.getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          return true;
        }
        return false;
      });

      if (hasMonthStart) {
        // 주의 중간에 월이 바뀌더라도 해당 열에 라벨 표시
        labels.push({
          index,
          label: `${lastMonth + 1}월`,
        });
      }
    });
    return labels;
  }, [weeks]);

  return (
    <section className="note-streak">
      <div className="section-header">
        <div className="header-left-group">
          <h3 className="section-title">
            <Combine size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            스트릭
          </h3>
          {streakCount >= 0 && (
            <span className="streak-count">
              🔥 {streakCount}일 연속
            </span>
          )}
        </div>

      </div>

      <div className="note-streak-content">
        {/* 월 라벨 */}
        <div className="streak-months">
          {monthLabels.map(m => (
            <span
              key={`${m.index}-${m.label}`}
              className="month-label"
              style={{
                left: `${m.index * (24 + 3)}px` // cellWidth + gap
              }}
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
      </div>
    </section>
  );
};

export default NoteStreak;
