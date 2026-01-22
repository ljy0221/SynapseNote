import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  children: React.ReactNode;
}

// 사이드바 컴포넌트 (내용은 props.children로 전달)
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, children }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {children}
    </aside>
  );
};
