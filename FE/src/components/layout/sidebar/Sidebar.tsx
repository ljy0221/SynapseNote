// src/components/layout/sidebar/Sidebar.tsx
import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="sidebar-wrapper">
      {/* 실제 사이드바 패널 */}
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {children}
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
