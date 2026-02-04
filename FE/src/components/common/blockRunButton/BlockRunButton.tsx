// src/components/common/blockRunButton/BlockRunButton.tsx
import React from 'react';
import './BlockRunButton.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

import { Play, Loader2 } from 'lucide-react';

const BlockRunButton: React.FC<Props> = ({ onClick, disabled }) => {
  return (
    <button
      className="block-run-btn"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "실행 중..." : "코드 실행"}
    >
      {disabled ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <Play size={18} fill="currentColor" />
      )}
    </button>
  );
};

export default BlockRunButton;