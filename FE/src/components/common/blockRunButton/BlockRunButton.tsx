// src/components/common/blockRunButton/BlockRunButton.tsx
import React from 'react';
import './BlockRunButton.css';

interface Props {
  onClick: () => void;
}

const BlockRunButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button className="block-run-btn" onClick={onClick}>
      <span className="run-icon">▶</span> Run
    </button>
  );
};

export default BlockRunButton;