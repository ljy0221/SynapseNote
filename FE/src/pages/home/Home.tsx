import React, { useEffect, useState } from 'react';
import RecentNotes from '../../components/layout/recentNotes/RecentNotes';
import NoteStreak from '../../components/layout/noteStreak/NoteStreak';
import './Home.css';

import { getNotesApi } from '../../api/notes/Notes.api';
import { adaptNotesForSidebar } from '../../api/notes/Notes.adapter';

import { getStreakApi } from '../../api/streak/Streak.api';
import { adaptStreakDates } from '../../api/streak/Streak.adapter';

import type { NoteListItem } from '../../types/note/GetNotes';

/**
 * 대시보드 메인 페이지 컴포넌트
 */
const Home: React.FC = () => {
    const [recentNotes, setRecentNotes] = useState<NoteListItem[]>([]);
    const [streakDates, setStreakDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);

            // 병렬 데이터 페칭 및 개별 상태 처리
            const results = await Promise.allSettled([
                getNotesApi(),
                getStreakApi(),
            ]);

            const [notesResult, streakResult] = results;

            // 노트 데이터 처리
            if (notesResult.status === 'fulfilled') {
                setRecentNotes(adaptNotesForSidebar(notesResult.value));
            } else {
                console.error('[Home] Notes 로딩 실패', notesResult.reason);
            }

            // 스트릭 데이터 처리
            if (streakResult.status === 'fulfilled') {
                setStreakDates(adaptStreakDates(streakResult.value));
            } else {
                console.error('[Home] Streak 로딩 실패', streakResult.reason);
                setStreakDates([]); // 실패 시 빈 배열로 폴백
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
            {/* 페이지 타이틀 */}
            <header className="home-header">
                <h2>Dashboard</h2>
            </header>

            {/* 대시보드 카드 영역 */}
            <section className="home-grid">
                {/* 최근 작업 문서 섹션 */}
                <div className="home-card section-card">
                    <RecentNotes notes={recentNotes} />
                </div>

                {/* 스트릭 시각화 섹션 */}
                <div className="home-card section-card">
                    <NoteStreak streak={{ dates: streakDates }} />
                </div>
            </section>
        </div>
    );
};

export default Home;