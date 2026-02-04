// src/components/common/blockRunButton/BlockRunButton.tsx
import React from 'react';
import { Play } from 'lucide-react';
import { Tooltip } from '../tooltip/Tooltip';
import './BlockRunButton.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

const BlockRunButton: React.FC<Props> = ({ onClick, disabled }) => {
  return (
    <Tooltip title={disabled ? '실행 중...' : '코드 실행'} placement="bottom">
      <button
        className="block-run-btn"
        onClick={onClick}
        disabled={disabled}
      >
        <Play size={16} />
      </button>
    </Tooltip>
  );
};

export default BlockRunButton;