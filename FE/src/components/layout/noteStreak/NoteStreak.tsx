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

const NoteStreak: React.FC<NoteStreakProps> = ({ streak }) => {
  const activityDates = streak.dates;
  const activitySet = new Set(activityDates);

  const streakCount = useMemo(
    () => calculateStreakCount(activityDates),
    [activityDates]
  );

  /** 오늘 기준 지난 26주(182일) 데이터 생성 (해당 주의 일요일부터 시작) */
  const days: Date[] = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();

    // 오늘로부터 181일 전(총 182일)을 구함
    const startCandidate = new Date(today);
    startCandidate.setDate(today.getDate() - 181);

    // 그 주의 일요일로 맞춤 (0: 일요일, 1: 월요일...)
    const dayOfWeek = startCandidate.getDay();
    const start = new Date(startCandidate);
    start.setDate(startCandidate.getDate() - dayOfWeek);

    // 182일(26주) + 일요일 맞춤에 따른 추가 일수만큼 생성하여 그리드가 딱 떨어지게 함
    // 하지만 단순하게 182일로 고정하고 싶다면 아래와 같이 26주 분량 생성
    for (let i = 0; i < 182; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

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

    return result;
  }, [days]);

  /** 월 라벨 계산 (간격: cellWidth 20px + gap 3px = 23px) */
  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      const hasMonthStart = week.some(d => {
        const m = d.getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          return true;
        }
        return false;
      });

      if (hasMonthStart) {
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
        <div className="streak-months">
          {monthLabels.map(m => (
            <span
              key={`${m.index}-${m.label}`}
              className="month-label"
              style={{
                left: `${m.index * 23}px` // 20px(cell) + 3px(gap)
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

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
