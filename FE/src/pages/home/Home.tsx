//Home 페이지

import React from 'react';
import RecentNotes from "../../components/layout/recentNotes/RecentNotes";
import NoteStreak from "../../components/layout/noteStreak/NoteStreak";
import './Home.css';
import type { GetStreakResponse } from '../../types/note/getStreak';
import type { GetNotesResponse } from '../../types/note/getNotes';

// 임시 더미 데이터
const mockNotesResponse: GetNotesResponse = {
  notes: [
    {
      noteId: '550e8400-e29b-41d4-a716-446655440000',
      title: '이진 탐색 알고리즘',
      directoryPath: '/알고리즘/탐색',
      pointX: 100.5,
      pointY: 200.3,
      role: 'OWNER',
      createdAt: '2026-01-22T10:00:00Z',
      updatedAt: '2026-01-22T15:30:00Z',
    },
    {
      noteId: '660e8400-e29b-41d4-a716-446655440001',
      title: '퀵 정렬',
      directoryPath: '/알고리즘/정렬',
      pointX: 150.0,
      pointY: 250.0,
      role: 'EDITOR',
      createdAt: '2026-01-21T09:00:00Z',
      updatedAt: '2026-01-21T14:00:00Z',
    },
    {
      noteId: '770e8400-e29b-41d4-a716-446655440002',
      title: 'REST API 설계 원칙',
      directoryPath: '/백엔드/아키텍처',
      pointX: 220.2,
      pointY: 180.6,
      role: 'OWNER',
      createdAt: '2026-01-20T08:30:00Z',
      updatedAt: '2026-01-22T09:10:00Z',
    },
  ],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 3,
    itemsPerPage: 20,
  },
};

const mockStreak: GetStreakResponse = {
  dates: [
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
  ],
};

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
        <div className="home-card section-card">
            <RecentNotes notes={mockNotesResponse.notes} />
        </div>
        {/* 스트릭 카드 */}
        <div className="home-card section-card">
          <NoteStreak streak={mockStreak} />
        </div>

      </section>
    </div>
  );
};

// 반드시 default export를 해주어야 App.tsx에서 자유롭게 이름을 정해 불러올 수 있습니다.
export default Home;