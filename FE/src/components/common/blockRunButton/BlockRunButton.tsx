// src/components/common/blockRunButton/BlockRunButton.tsx
import React from 'react';
import { Play } from 'lucide-react';
import './BlockRunButton.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

const BlockRunButton: React.FC<Props> = ({ onClick, disabled }) => {
  return (
    <button
      className="block-run-btn"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Running...' : 'Run Code'}
    >
      <Play size={16} fill="currentColor" />
    </button>
  );
};

export default BlockRunButton;