// src/components/common/contextMenu/ContextMenu.tsx
import { useEffect, useRef } from 'react';
import './ContextMenu.css';
import { ContextMenuState } from '../../../types/sidebar/ContextMenu';

interface Props {
  state: ContextMenuState;
  onClose: () => void;
  onDeleteNote: (noteId: string) => void;
  onCreateNote: (directoryPath: string) => void;
  onRenameNote: (noteId: string) => void;
}

export default function ContextMenu({
  state,
  onClose,
  onDeleteNote,
  onCreateNote,
  onRenameNote,
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
          ➕ 이 위치에 새 노트
        </div>
      )}

      {/*  노트 메뉴 */}
      {state.type === 'NOTE' && state.targetId && (
        // 노트 제목 수정
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

              console.log(
                '[ContextMenu] rename note',
                state.targetId
              );
              onRenameNote(state.targetId);
              onClose();
            }}
          >
            ✏️ 노트 제목 수정
          </div>
      )}
      {state.type === 'NOTE' && state.targetId && (
        <div
          className="context-menu-item"
          //  핵심: mousedown 단계에서 기본 동작 차단
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!state.targetId) {
              console.warn(
                '[ContextMenu] delete blocked: targetId missing'
              );
              return;
            }

            if (state.targetId.startsWith('temp-')) {
              console.warn(
                '[ContextMenu] delete blocked: temp note',
                state.targetId
              );
              return;
            }

            console.log(
              '[ContextMenu] delete note',
              state.targetId
            );
            onDeleteNote(state.targetId);
            onClose();
          }}
        >
          ❌ 노트 삭제
        </div>
      )}
    </div>
  );
}
