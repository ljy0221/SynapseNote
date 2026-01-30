// src/components/layout/sidebar/NoteDirectory.tsx
import React, { useState } from 'react';
import './NoteDirectory.css';
import type { NoteTreeNode } from '../../features/noteDirectory/buildNoteTree';
import AddRecommendButton from '../../common/addRecommendButton/AddRecommendButton';
import { Folder, FolderOpen, FileText } from 'lucide-react';
import { ContextMenuState } from '../../../types/sidebar/ContextMenu';

interface NoteDirectoryProps {
  node: NoteTreeNode;
  depth?: number;
  activeNoteId?: string | null;

  favoriteNoteIds: Set<string>;
  onToggleFavorite: (noteId: string) => void;

  onSelectNote: (noteId: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
}

export const NoteDirectory: React.FC<NoteDirectoryProps> = ({
  node,
  depth = 0,
  activeNoteId,
  favoriteNoteIds,
  onToggleFavorite,
  onSelectNote,
  onContextMenu,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isRoot = node.name === 'root';

  return (
    <div className="note-directory">
      {/* 디렉토리 */}
      {!isRoot && (
        <div
          className="tree-row directory"
          style={{ paddingLeft: depth * 14 }}
          onClick={() => setIsOpen(prev => !prev)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              type: 'DIRECTORY',
              directoryPath: node.path,
            });
          }}
        >
          <span className="tree-icon">
            {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
          </span>
          <span className="tree-title">{node.name}</span>
        </div>
      )}

      {isOpen && (
        <>
          {/* 하위 디렉토리 */}
          {node.children.map(child => (
            <NoteDirectory
              key={child.path}
              node={child}
              depth={depth + 1}
              activeNoteId={activeNoteId}
              favoriteNoteIds={favoriteNoteIds}
              onToggleFavorite={onToggleFavorite}
              onSelectNote={onSelectNote}
              onContextMenu={onContextMenu}
            />
          ))}

          {/* 노트 */}
          {node.notes.map(note => {
            const isFavorite = favoriteNoteIds.has(note.noteId);
            const isTempNote =
              !note.noteId || note.noteId.startsWith('temp-');

            return (
              <div
                key={note.noteId}
                className={`tree-row note ${
                  activeNoteId === note.noteId ? 'active' : ''
                }`}
                style={{ paddingLeft: (depth + 1) * 14 }}
                onClick={() => {
                  console.log('[NoteDirectory] note clicked', note.noteId);
                  onSelectNote(note.noteId);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: 'NOTE',
                    targetId: note.noteId,
                  });
                }}
              >
                <span className="tree-icon">
                  <FileText size={13} />
                </span>

                <span className="side-note-title">
                  {note.title}
                  {isTempNote && (
                    <span className="temp-note-label"></span>
                  )}
                </span>

                <AddRecommendButton
                  active={isFavorite}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTempNote) {
                      console.warn(
                        '[NoteDirectory] temp note bookmark blocked',
                        note.noteId
                      );
                      return;
                    }
                    onToggleFavorite(note.noteId);
                  }}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
