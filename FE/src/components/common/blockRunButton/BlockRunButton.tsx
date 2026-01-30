// src/components/common/blockRunButton/BlockRunButton.tsx
import React from 'react';
import './BlockRunButton.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

const BlockRunButton: React.FC<Props> = ({ onClick, disabled }) => {
  return (
    <button className="block-run-btn" onClick={onClick} disabled={disabled}>
      <span className="run-icon">▶</span> {disabled ? 'Running...' : 'Run'}
    </button>
  );
};

export default BlockRunButton;