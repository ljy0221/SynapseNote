// src/components/layout/sidebar/Sidebar.tsx
import React, { useState } from 'react';
import './Sidebar.css';

import type { NoteListItem } from '../../../types/note/getNotes';
import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';
import ContextMenu from '../../common/contextMenu/ContextMenu';

/** 🔥 테스트용 mock 데이터 (나중에 제거) */
export const mockNotes: NoteListItem[] = [
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

// 사이드바 우클릭 메뉴
type ContextMenuState =
  | { visible: false }
  | {
      visible: true;
      x: number;
      y: number;
      type: 'NOTE' | 'DIRECTORY';
      targetId?: string;
      directoryPath?: string;
    };

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  /** 🔥 mock 기반 디렉토리 트리 */
  const noteTree = buildNoteTree(mockNotes);
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null);
  /** ⭐ 즐겨찾기 상태 */
  const [favoriteNoteIds, setFavoriteNoteIds] = useState<Set<string>>(
    new Set()
  );

  /** 🖱 우클릭 메뉴 상태 */
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState>({ visible: false });

  const handleToggleFavorite = (noteId: string) => {
    setFavoriteNoteIds(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  };


  return (
    <div className="sidebar-wrapper">
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <NoteDirectory
            node={noteTree}
            activeNoteId={activeNoteId}
            favoriteNoteIds={favoriteNoteIds}
            onSelectNote={(noteId) => {
              setActiveNoteId(noteId);
              console.log('선택한 노트:', noteId);
            }}
            onToggleFavorite={handleToggleFavorite}
            onContextMenu={setContextMenu}
          />
        </div>
      </aside>


      {/* 사이드바 토글 버튼 */}
      <button
        className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        {isOpen ? '⟨' : '⟩'}
      </button>

      {/* 우클릭 컨텍스트 메뉴 */}
      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu({ visible: false })}
        onDeleteNote={(id) => {
          console.log('노트 삭제:', id);
        }}
        onCreateNote={(path) => {
          console.log('노트 생성 위치:', path);
        }}
      />
    </div>
  );
};
