// src/components/common/blockCopyButton/BlockCopyButton.tsx
import React from 'react';
import { Copy, Check } from 'lucide-react';
import './BlockCopyButton.css';

interface Props {
  onCopy: () => void;
}

const BlockCopyButton: React.FC<Props> = ({ onCopy }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="block-copy-btn" onClick={handleCopy} title="Copy Code">
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

export default BlockCopyButton;