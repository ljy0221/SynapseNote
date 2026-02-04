import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { SummaryStyle } from '../../../types/ai/NoteSummary';
import './NoteSummary.css';

interface NoteSummaryProps {
  summary?: string;
  summaryStyle?: string;
  summaryUpdatedAt?: string;
  isLoading: boolean;
  onGenerateSummary: (style: SummaryStyle) => void;
}

export const NoteSummary: React.FC<NoteSummaryProps> = ({
  summary,
  summaryUpdatedAt,
  isLoading,
  onGenerateSummary
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>('concise');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!summary) {
    return null;
  }

  return (
    <div className="note-summary-container">
      <div className="summary-content">
        <div className="summary-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="summary-title">
            <span className="sparkle-icon">&#10024;</span>
            <span>AI 요약</span>
            {summaryUpdatedAt && (
              <span className="summary-date">{formatDate(summaryUpdatedAt)}</span>
            )}
          </div>
          <div className="summary-actions">
            <select
              className="summary-style-select small"
              value={selectedStyle}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedStyle(e.target.value as SummaryStyle);
              }}
              disabled={isLoading}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="concise">간결</option>
              <option value="detailed">상세</option>
              <option value="bullet-points">불릿</option>
            </select>
            <button
              className="summary-refresh-btn"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateSummary(selectedStyle);
              }}
              disabled={isLoading}
              title="다시 생성"
            >
              <span className={`refresh-icon ${isLoading ? 'spinning' : ''}`}>&#8635;</span>
            </button>
            <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>
        {isExpanded && (
          <div className="summary-text">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSummary;
