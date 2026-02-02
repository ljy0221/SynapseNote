// src/components/common/contextMenu/ContextMenu.tsx
import { useEffect, useRef } from 'react';
import './ContextMenu.css';
import { ContextMenuState } from '../../../types/sidebar/ContextMenu';
import { Pencil, Trash2, FolderPlus, FolderInput } from 'lucide-react';

interface Props {
  state: ContextMenuState;
  onClose: () => void;
  onDeleteNote: (noteId: string) => void;
  onCreateNote: (directoryPath: string) => void;
  onRenameNote: (noteId: string) => void;
  onMoveNote: (noteId: string, directoryPath: string) => void; // ⭐ 추가
}

export default function ContextMenu({
  state,
  onClose,
  onDeleteNote,
  onCreateNote,
  onRenameNote,
  onMoveNote,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   *  메뉴 밖 클릭 시 닫기
   * - click 단계에서 처리 (mousedown )
   * - 내부 클릭은 stopPropagation으로 차단
   */
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

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [state.visible, onClose]);

  if (!state.visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: state.y, left: state.x }}
      //  루트에서는 propagation만 차단 (preventDefault )
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/*  디렉토리 메뉴 */}
      {state.type === 'DIRECTORY' && state.directoryPath && (
        <div
          className="context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onCreateNote(state.directoryPath);
            onClose();
          }}
        >
          <FolderPlus size={16} />
          <span>이 위치에 새 노트</span>
        </div>
      )}

      {/*  노트 메뉴 */}
      {state.type === 'NOTE' && state.targetId && (
        <div
          className="context-menu-item"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (state.targetId.startsWith('temp-')) return;

            onRenameNote(state.targetId);
            onClose();
          }}
        >
          <Pencil size={16} />
          <span>노트 제목 수정</span>
        </div>
      )}

      {state.type === 'NOTE' && state.targetId && (
        <div
          className="context-menu-item"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!state.targetId || state.targetId.startsWith('temp-')) return;

            onDeleteNote(state.targetId);
            onClose();
          }}
        >
          <Trash2 size={16} />
          <span>노트 삭제</span>
        </div>
      )}
      {/* 노트 위치 변경 */}
      {state.type === 'NOTE' && state.targetId && (
        <div
          className="context-menu-item"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (state.targetId.startsWith('temp-')) return;

            onMoveNote(state.targetId, state.directoryPath);
            onClose();
          }}
        >
          <FolderInput size={16} />
          <span>노트 위치 변경</span>
        </div>
      )}

    </div>
  );
}
