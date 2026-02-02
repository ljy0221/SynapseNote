import { useEffect, useState } from 'react';
import './MoveNoteModal.css';

interface Props {
  isOpen: boolean;
  currentPath: string;
  onConfirm: (newPath: string) => void;
  onCancel: () => void;
}

export default function MoveNoteModal({
  isOpen,
  currentPath,
  onConfirm,
  onCancel,
}: Props) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    setPath(currentPath);
  }, [currentPath]);

  if (!isOpen) return null;

  /** 변경 확정 공통 로직 */
  const handleConfirm = () => {
    if (!path.trim()) return;

    const normalized = path.startsWith('/')
      ? path
      : `/${path}`;

    onConfirm(normalized);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3>노트 위치 변경</h3>

        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/디렉토리/경로"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // form submit 방지
              handleConfirm();
            }
          }}
          autoFocus
        />

        <div className="modal-actions">
          <button onClick={onCancel}>취소</button>
          <button onClick={handleConfirm}>
            변경
          </button>
        </div>
      </div>
    </div>
  );
}
