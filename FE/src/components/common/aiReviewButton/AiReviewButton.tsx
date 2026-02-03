// src/components/common/aiReviewButton/AiReviewButton.tsx

import React from 'react';
import { Sparkles } from 'lucide-react';
import './AiReviewButton.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const AiReviewButton: React.FC<Props> = ({ onClick, disabled, loading }) => {
  return (
    <button
      className="ai-review-btn"
      onClick={onClick}
      disabled={disabled || loading}
      title="AI 코드 리뷰"
    >
      <Sparkles size={14} className={loading ? 'spin' : ''} />
      {loading ? 'Reviewing...' : 'AI Review'}
    </button>
  );
};

export default AiReviewButton;
