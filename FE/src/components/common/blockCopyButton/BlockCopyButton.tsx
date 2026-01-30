// src/components/common/blockCopyButton/BlockCopyButton.tsx
import React from 'react';
import './BlockCopyButton.css';

interface Props {
  onCopy: () => void;
}

const BlockCopyButton: React.FC<Props> = ({ onCopy }) => {
  return (
    <button className="block-copy-btn" onClick={onCopy}>
      {/* 아이콘 대신 이모지 사용 */}
      <span>Copy</span>
    </button>
  );
};

export default BlockCopyButton;