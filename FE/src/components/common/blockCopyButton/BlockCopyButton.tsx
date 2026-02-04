// src/components/common/blockCopyButton/BlockCopyButton.tsx
import { Copy, Check } from 'lucide-react';
import React, { useState } from 'react';
import './BlockCopyButton.css';

interface Props {
  onCopy: () => void;
}

const BlockCopyButton: React.FC<Props> = ({ onCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = () => {
    onCopy();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      className="block-copy-btn"
      onClick={handleClick}
      title={isCopied ? "복사완료" : "코드 복사"}
    >
      {isCopied ? <Check size={18} /> : <Copy size={18} />}
    </button>
  );
};

export default BlockCopyButton;