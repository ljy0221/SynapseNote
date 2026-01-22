import React from 'react'; // React를 불러옵니다.
import './NoteToolBar.css';

interface NoteToolBarProps {
  isOpen: boolean;
  children?: React.ReactNode; 
}

export const NoteToolBar = ({ isOpen, children }: NoteToolBarProps) => {
  return (
    <aside className={`note-toolbar ${isOpen ? 'open' : ''}`}>
      {/* App.tsx에서 전달한 <div className="toolbar-header">...</div>가 이 자리에 렌더링됩니다. */}
      {children} 
      
      <div className="toolbar-items">
        <button className="item">h1</button>
        <button className="item">h2</button>
        <button className="item">h3</button>
      </div>
    </aside>
  );
};