// src/components/home/recentDocuments/RecentDocuments.tsx
import React from 'react';
import './RecentDocuments.css';

/**
 * 백엔드 API 응답 구조에 맞춘 mock 데이터
 */
type Note = {
  noteId: string;
  title: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
};

const mockNotes: Note[] = [
  {
    noteId: '550e8400-e29b-41d4-a716-446655440000',
    title: '이진 탐색 알고리즘',
    directoryPath: '/알고리즘/탐색',
    pointX: 100.5,
    pointY: 200.3,
    role: 'OWNER',
    createdAt: '2025-01-22T10:00:00Z',
    updatedAt: '2025-01-22T15:30:00Z',
  },
  {
    noteId: '660e8400-e29b-41d4-a716-446655440001',
    title: '퀵 정렬',
    directoryPath: '/알고리즘/정렬',
    pointX: 150.0,
    pointY: 250.0,
    role: 'EDITOR',
    createdAt: '2025-01-21T09:00:00Z',
    updatedAt: '2025-01-21T14:00:00Z',
  },
  {
    noteId: '770e8400-e29b-41d4-a716-446655440002',
    title: 'REST API 설계 원칙',
    directoryPath: '/백엔드/아키텍처',
    pointX: 220.2,
    pointY: 180.6,
    role: 'OWNER',
    createdAt: '2025-01-20T08:30:00Z',
    updatedAt: '2025-01-22T09:10:00Z',
  },
];

const RecentDocuments: React.FC = () => {
  return (
    <section className="recent-documents">
      <h3 className="section-title">최근 작업한 문서</h3>

      <div className="document-list">
        {mockNotes.slice(0, 3).map(note => (
          <div key={note.noteId} className="document-card">
            <h4 className="document-title">{note.title}</h4>

            <span className="document-path">
              {note.directoryPath}
            </span>

            <span className="document-date">
              마지막 수정: {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentDocuments;
