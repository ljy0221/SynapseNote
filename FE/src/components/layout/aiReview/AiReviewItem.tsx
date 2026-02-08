// src/components/layout/aiReview/AiReviewItem.tsx

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ReviewItem } from '../../../types/ai/CodeReview';
import './AiReviewItem.css';

interface Props {
  item: ReviewItem;
}

const getSeverityColor = (severity: string): string => {
  switch (severity.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return '#ef4444';
    case 'MEDIUM':
    case 'WARNING':
      return '#f59e0b';
    case 'LOW':
    case 'INFO':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return <AlertCircle size={16} />;
    case 'MEDIUM':
    case 'WARNING':
      return <AlertTriangle size={16} />;
    default:
      return <Info size={16} />;
  }
};

const AiReviewItem: React.FC<Props> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const severityColor = getSeverityColor(item.severity);

  return (
    <div
      className="ai-review-item"
      style={{ borderLeftColor: severityColor }}
    >
      <div
        className="review-item-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="review-item-left">
          <span className="severity-icon" style={{ color: severityColor }}>
            {getSeverityIcon(item.severity)}
          </span>
          <span className="review-category">{item.category}</span>
          {item.lineNumber && (
            <span className="line-number">Line {item.lineNumber}</span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      <div className="review-item-issue">{item.issue}</div>

      {isExpanded && (
        <div className="review-item-suggestion">
          <strong>제안:</strong> {item.suggestion}
        </div>
      )}
    </div>
  );
};

export default AiReviewItem;
