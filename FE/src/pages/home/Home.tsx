//Home 페이지

import React from 'react';
import RecentNotes from "../../components/layout/recentNotes/RecentNotes";
import NoteStreak from "../../components/layout/noteStreak/NoteStreak";
import './Home.css';

// 임시 더미 데이터
const mockActivityDates: string[] = [
  '2026-01-02',
  '2026-01-03',
  '2026-01-04',
  '2026-01-07',
  '2026-01-10',
  '2026-01-15',
  '2026-01-16',
  '2026-01-20',
  '2026-01-21',
  '2026-01-22',
  '2026-01-23',
  '2026-01-24',
  '2026-01-25',
  '2026-01-26',
];

/**
 * 각 페이지 컴포넌트
 * App.tsx에서 이미 Header와 Sidebar를 감싸고 있으므로,
 * 여기서는 본문에 들어갈 내용만 작성하면 됩니다.
 */

const Home: React.FC = () => {
  return (
    <div className="home-container">
      {/* 페이지 타이틀 */}
      <header className="home-header">
        <h2>DashBoard</h2>
      </header>

      {/* 대시보드 카드 영역 */}
      <section className="home-grid">
        {/* 최근 작업 문서 카드 */}
        <div className="home-card placeholder-card">
            <RecentNotes />
        </div>
        {/* 스트릭 카드 */}
        <div className="home-card streak-card">
          <NoteStreak activityDates={mockActivityDates} />
        </div>

      </section>
    </div>
  );
};

// 반드시 default export를 해주어야 App.tsx에서 자유롭게 이름을 정해 불러올 수 있습니다.
export default Home;