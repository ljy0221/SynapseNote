// src/components/common/contextMenu/ContextMenu.tsx
import { useEffect, useRef } from 'react';
import './ContextMenu.css';

interface Props {
  state:
    | { visible: false }
    | {
        visible: true;
        x: number;
        y: number;
        type: 'NOTE' | 'DIRECTORY';
        targetId?: string;
        directoryPath?: string;
      };
  onClose: () => void;
  onDeleteNote: (noteId: string) => void;
  onCreateNote: (directoryPath?: string) => void;
}

export default function ContextMenu({
  state,
  onClose,
  onDeleteNote,
  onCreateNote,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ 메뉴 밖 클릭 감지
  useEffect(() => {
    if (!state.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.visible, onClose]);

  if (!state.visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: state.y, left: state.x }}
      onClick={(e) => e.stopPropagation()} // 내부 클릭 차단
    >
      {state.type === 'DIRECTORY' && (
        <div
          className="context-menu-item"
          onClick={() => {
            onCreateNote(state.directoryPath);
            onClose();
          }}
        >
          ➕ 이 위치에 새 노트
        </div>
      )}

      {state.type === 'NOTE' && (
        <div
          className="context-menu-item danger"
          onClick={() => {
            onDeleteNote(state.targetId!);
            onClose();
          }}
        >
          🗑 노트 삭제
        </div>
      )}
    </div>
  );
}
