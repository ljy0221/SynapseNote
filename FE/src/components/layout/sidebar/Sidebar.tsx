// src/components/layout/sidebar/Sidebar.tsx
import React from 'react';
import './Sidebar.css';

import type { NoteListItem } from '../../../types/note/getNotes';
import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';

/** 🔥 테스트용 mock 데이터 (나중에 제거) */
const mockNotes: NoteListItem[] = [
  {
    noteId: 'n1',
    title: '이진 탐색',
    directoryPath: '/알고리즘/탐색',
    pointX: 0,
    pointY: 0,
    role: 'OWNER',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-22T15:30:00Z',
  },
  {
    noteId: 'n2',
    title: '퀵 정렬',
    directoryPath: '/알고리즘/정렬',
    pointX: 0,
    pointY: 0,
    role: 'EDITOR',
    createdAt: '2026-01-21T09:00:00Z',
    updatedAt: '2026-01-21T14:00:00Z',
  },
  {
    noteId: 'n3',
    title: 'REST API 설계',
    directoryPath: '/백엔드/아키텍처',
    pointX: 0,
    pointY: 0,
    role: 'OWNER',
    createdAt: '2026-01-22T08:30:00Z',
    updatedAt: '2026-01-22T09:10:00Z',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // 테스트 동안 optional
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  children,
}) => {
  /** 🔥 mock 기반 디렉토리 트리 */
  const noteTree = buildNoteTree(mockNotes);
  
  return (
    <div className="sidebar-wrapper">
      {/* 실제 사이드바 패널 */}
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <NoteDirectory
            node={noteTree}
            onSelectNote={(noteId) => {
              console.log('선택한 노트:', noteId);
            }}
          />
        </div>
      </aside>

      {/* 사이드바 토글 버튼 */}
      <button
        className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? '⟨' : '⟩'}
      </button>
    </div>
  );
};
