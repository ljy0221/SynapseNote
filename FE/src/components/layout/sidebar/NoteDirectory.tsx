// src/components/layout/sidebar/NoteDirectory.tsx
import React, { useState } from 'react';
import './NoteDirectory.css';
import type { NoteTreeNode } from '../../features/noteDirectory/buildNoteTree';
import AddRecommendButton from '../../common/addRecommendButton/AddRecommendButton';
import { Folder, FolderOpen, FileText } from 'lucide-react';


interface NoteDirectoryProps {
  node: NoteTreeNode;
  depth?: number;
  activeNoteId?: string | null;
  onSelectNote: (noteId: string) => void;
}

export const NoteDirectory: React.FC<NoteDirectoryProps> = ({
  node,
  depth = 0,
  activeNoteId,
  onSelectNote,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isRoot = node.name === 'root';

  return (
    <div className="note-directory">
      {/* 📁 Directory */}
      {!isRoot && (
        <div
          className="tree-row directory"
          style={{ paddingLeft: depth * 14 }}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span className="tree-icon">
            {isOpen ? (
              <FolderOpen size={14} />
            ) : (
              <Folder size={14} />
            )}
          </span>

          <span className="tree-title">{node.name}</span>
        </div>
      )}

      {isOpen && (
        <>
          {node.children.map(child => (
            <NoteDirectory
              key={child.path}
              node={child}
              depth={depth + 1}
              activeNoteId={activeNoteId}
              onSelectNote={onSelectNote}
            />
          ))}

          {/* 📝 Notes */}
          {node.notes.map(note => (
            <div
              key={note.noteId}
              className={`tree-row note ${
                activeNoteId === note.noteId ? 'active' : ''
              }`}
              style={{ paddingLeft: (depth + 1) * 14 }}
              onClick={() => onSelectNote(note.noteId)}
            >
              <span className="tree-icon">
                <FileText size={13} />
              </span>

              <span className="side-note-title">
                {note.title}
              </span>

              <div onClick={(e) => e.stopPropagation()}>
                <AddRecommendButton
                  noteId={note.noteId}
                  isFavorite={note.noteId === 'n1'}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
