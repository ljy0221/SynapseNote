import React, { useEffect, useState } from 'react';
import RecentNotes from '../../components/layout/recentNotes/RecentNotes';
import NoteStreak from '../../components/layout/noteStreak/NoteStreak';
import './Home.css';

import { getNotesApi } from '../../api/notes/Notes.api';
import { adaptNotesForSidebar } from '../../api/notes/Notes.adapter';

import { getStreakApi } from '../../api/streak/Streak.api';
import { adaptStreakDates } from '../../api/streak/Streak.adapter';

import type { NoteListItem } from '../../types/note/GetNotes';
import { useAuthStore } from '../../store/useAuthStore';

import NoteBookmarkSection from '../../components/layout/noteBookmark/NoteBookmarkSection';
import BlockBookmarkSection from '../../components/layout/blockBookmark/BlockBookmarkSection';

const Home: React.FC = () => {
  const { userInfo, isLoading: userLoading } = useAuthStore();
  const memberId = userInfo?.memberId;

  const [recentNotes, setRecentNotes] = useState<NoteListItem[]>([]);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //  memberId 없으면 절대 호출 안 함
    if (!memberId) return;

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const [notesRes, streakRes] = await Promise.all([
          getNotesApi(),
          getStreakApi(memberId),
        ]);

        setRecentNotes(adaptNotesForSidebar(notesRes));
        setStreakDates(adaptStreakDates(streakRes));
      } catch (e) {
        console.error('[Home] Dashboard 로딩 실패', e);
        setStreakDates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [memberId]);

  //  인증 로딩 + 데이터 로딩 분리
  if (userLoading || loading) {
    return <div className="home-container">Loading...</div>;
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h2>Dashboard</h2>
      </header>

      <section className="home-grid">
        <div className="home-card section-card">
          <RecentNotes notes={recentNotes} />
        </div>

        <div className="home-card section-card">
          <NoteStreak streak={{ dates: streakDates }} />
        </div>

        <div className="home-card section-card">
          <NoteBookmarkSection />
        </div>

        <div className="home-card section-card">
          <BlockBookmarkSection />
        </div>
      </section>
    </div>
  );
};

export default Home;
