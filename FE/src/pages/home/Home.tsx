import React, { useEffect, useState } from 'react';
import RecentNotes from '../../components/layout/recentNotes/RecentNotes';
import NoteStreak from '../../components/layout/noteStreak/NoteStreak';
import './Home.css';

import { getNotesApi } from '../../api/notes/Notes.api';
import { adaptRecentNotes } from '../../api/notes/Notes.adapter';

import { getStreakApi } from '../../api/streak/Streak.api';
import { adaptStreakDates } from '../../api/streak/Streak.adapter';

import type { NoteListItem } from '../../types/note/GetNotes';

const Home: React.FC = () => {
  const [recentNotes, setRecentNotes] = useState<NoteListItem[]>([]);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
  
      const results = await Promise.allSettled([
        getNotesApi(),
        getStreakApi(),
      ]);
  
      const [notesResult, streakResult] = results;
  
      if (notesResult.status === 'fulfilled') {
        setRecentNotes(adaptRecentNotes(notesResult.value));
      } else {
        console.error('[Home] Notes 로딩 실패', notesResult.reason);
      }
  
      if (streakResult.status === 'fulfilled') {
        setStreakDates(adaptStreakDates(streakResult.value));
      } else {
        console.error('[Home] Streak 로딩 실패', streakResult.reason);
        setStreakDates([]); // fallback
      }
  
      setLoading(false);
    };
  
    fetchDashboardData();
  }, []);


  if (loading) {
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
      </section>
    </div>
  );
};

export default Home;
