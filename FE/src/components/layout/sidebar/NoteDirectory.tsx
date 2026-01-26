// src/components/layout/sidebar/NoteDirectory.tsx
import React, { useState } from 'react';
import './NoteDirectory.css';
import type { NoteTreeNode } from '../../features/noteDirectory/buildNoteTree';
import AddRecommendButton from '../../common/addRecommendButton/AddRecommendButton';

interface NoteDirectoryProps {
  node: NoteTreeNode;
  depth?: number;
  onSelectNote: (noteId: string) => void;
}

export const NoteDirectory: React.FC<NoteDirectoryProps> = ({
  node,
  depth = 0,
  onSelectNote,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const isRoot = node.name === 'root';

  return (
    <div className="note-directory">
      {!isRoot && (
        <div
          className="directory-row"
          style={{ paddingLeft: depth * 14 }}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span className="directory-arrow">
            {isOpen ? '▾' : '▸'}
          </span>
          <span className="directory-name">
            {node.name}
          </span>
        </div>
      )}

      {isOpen && (
        <>
          {node.children.map(child => (
            <NoteDirectory
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelectNote={onSelectNote}
            />
          ))}

          {node.notes.map(note => {
            const isFavorite = note.noteId === 'n1'; // 🔥 mock 상태

            return (
              <div
                key={note.noteId}
                className="note-row"
                style={{ paddingLeft: (depth + 1) * 14 }}
              >
                {/* 제목 영역 */}
                <div
                  className="note-title"
                  onClick={() => onSelectNote(note.noteId)}
                >
                  {note.title}
                </div>

                {/* 즐겨찾기 버튼 (우측 고정) */}
                <AddRecommendButton
                  noteId={note.noteId}
                  isFavorite={isFavorite}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
