// src/components/layout/sidebar/NoteDirectory.tsx
import React, { useState, useRef, useEffect } from 'react';
import './NoteDirectory.css';
import type { NoteTreeNode } from '../../features/noteDirectory/buildNoteTree';
import AddRecommendButton from '../../common/addRecommendButton/AddRecommendButton';
import { Folder, FolderOpen, FileText } from 'lucide-react';
import { ContextMenuState } from '../../../types/sidebar/ContextMenu';

interface NoteDirectoryProps {
  node: NoteTreeNode;
  depth?: number;
  activeNoteId?: string | null;
  editingNoteId?: string | null;

  favoriteNoteIds: Set<string>;
  onToggleFavorite: (noteId: string) => void;

  onSelectNote: (noteId: string) => void;
  onContextMenu: (state: ContextMenuState) => void;

  onConfirmRename: (noteId: string, newTitle: string) => void;
  onCancelRename: () => void;
  onMoveNote: (noteId: string, targetPath: string) => void;
  disableContextMenu?: boolean;
  hideFavorite?: boolean; // [New]
}

export const NoteDirectory: React.FC<NoteDirectoryProps> = ({
  node,
  depth = 0,
  activeNoteId,
  editingNoteId,
  favoriteNoteIds,
  onToggleFavorite,
  onSelectNote,
  onContextMenu,
  onConfirmRename,
  onCancelRename,
  onMoveNote,
  disableContextMenu,
  hideFavorite, // [New]
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const isRoot = node.name === 'root';

  return (
    <div className="note-directory">
      {!isRoot && (
        <div
          className={`tree-row directory ${isDragOver ? 'drag-over' : ''}`}
          style={{ paddingLeft: depth * 14 }}
          onClick={() => setIsOpen(prev => !prev)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (disableContextMenu) return; // [New] Block context menu if prop is set
            onContextMenu({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              type: 'DIRECTORY',
              directoryPath: node.path,
            });
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const noteId = e.dataTransfer.getData('noteId');
            if (noteId) {
              onMoveNote(noteId, node.path);
            }
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
          {node.children.map(child => (
            <NoteDirectory
              key={child.path}
              node={child}
              depth={depth + 1}
              activeNoteId={activeNoteId}
              editingNoteId={editingNoteId}
              favoriteNoteIds={favoriteNoteIds}
              onToggleFavorite={onToggleFavorite}
              onSelectNote={onSelectNote}
              onContextMenu={onContextMenu}
              onConfirmRename={onConfirmRename}
              onCancelRename={onCancelRename}
              onMoveNote={onMoveNote}
              disableContextMenu={disableContextMenu}
              hideFavorite={hideFavorite} // [New] Propagate prop to children
            />
          ))}

          {node.notes.map(note => {
            const isFavorite = favoriteNoteIds.has(note.noteId);
            const isEditing = editingNoteId === note.noteId;
            const isTempNote =
              !note.noteId || note.noteId.startsWith('temp-');

            return (
              <div
                key={note.noteId}
                className={`tree-row note ${activeNoteId === note.noteId ? 'active' : ''
                  }`}
                style={{ paddingLeft: (depth + 1) * 14 }}
                onClick={() => {
                  if (!isEditing) {
                    onSelectNote(note.noteId);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (disableContextMenu) return; // [New] Block context menu if prop is set
                  onContextMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: 'NOTE',
                    targetId: note.noteId,
                    directoryPath: node.path,
                    role: note.role, // [New]
                  });
                }}
                draggable={!isEditing && !isTempNote && note.role !== 'VIEWER'} // [Modified] VIEWER 권한 체크 추가
                onDragStart={(e) => {
                  e.dataTransfer.setData('noteId', note.noteId);
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <span className="tree-icon">
                  <FileText size={13} />
                </span>

                {isEditing && !isTempNote ? (
                  <InlineTitleEditor
                    initialValue={note.title}
                    onConfirm={(value) =>
                      onConfirmRename(note.noteId, value)
                    }
                    onCancel={onCancelRename}
                  />
                ) : (
                  <span className="side-note-title">
                    {note.title}
                  </span>
                )}

                {!hideFavorite && ( // [New] Conditionally render favorite button
                  <AddRecommendButton
                    active={isFavorite}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isTempNote) return;
                      onToggleFavorite(note.noteId);
                    }}
                  />
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

function InlineTitleEditor({
  initialValue,
  onConfirm,
  onCancel,
}: {
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      className="inline-title-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        // 외부 클릭 시 무조건 취소
        onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm(value.trim());
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
}
