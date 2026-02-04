import React, { useEffect, useState, useCallback } from 'react';
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

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!memberId) return;
    if (!isSilent) setLoading(true);

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
  }, [memberId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 노트 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleNotesChanged = () => {
      fetchDashboardData(true); // 사이드바 변경 시에는 "조용히" 갱신
    };

    window.addEventListener('notes-changed', handleNotesChanged);
    return () => {
      window.removeEventListener('notes-changed', handleNotesChanged);
    };
  }, [fetchDashboardData]);

  //  인증 로딩 + 데이터 로딩 분리
  if (userLoading || loading) {
    return <div className="home-container">Loading...</div>;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <section className="home-grid">
          {/* 좌측 메인 컬럼 */}
          <div className="left-column">
            <div className="home-card section-card">
              <RecentNotes notes={recentNotes} />
            </div>

            <div className="home-card section-card">
              <NoteStreak streak={{ dates: streakDates }} />
            </div>
          </div>

          {/* 우측 사이드 컬럼 (북마크) */}
          <div className="right-column">
            <div className="home-card section-card">
              <NoteBookmarkSection />
            </div>

            <div className="home-card section-card">
              <BlockBookmarkSection />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
