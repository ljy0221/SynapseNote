// src/components/common/aiReviewButton/AiReviewButton.tsx

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Tooltip } from '../tooltip/Tooltip';
import './AiReviewButton.css';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  disabledReason?: string;
}

const AiReviewButton: React.FC<Props> = ({ onClick, disabled, loading, disabledReason }) => {
  const isDisabled = disabled || loading || !!disabledReason;
  const tooltipContent = disabledReason || 'AI가 코드를 분석하고 개선점을 제안합니다';

  return (
    <Tooltip title="AI 코드 리뷰" content={tooltipContent} placement="bottom">
      <button
        className={`ai-review-btn ${isDisabled ? 'disabled' : ''}`}
        onClick={onClick}
        disabled={isDisabled}
      >
        <Sparkles size={14} className={loading ? 'spin' : ''} />
        {loading ? 'Reviewing...' : 'AI Review'}
      </button>
    </Tooltip>
  );
};

export default AiReviewButton;
