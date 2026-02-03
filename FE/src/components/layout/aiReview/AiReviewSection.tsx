// src/components/layout/aiReview/AiReviewSection.tsx

import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import AiReviewItem from './AiReviewItem';
import type { CodeReviewResponse } from '../../../types/ai/CodeReview';
import './AiReviewSection.css';

interface Props {
  result: CodeReviewResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose: () => void;
}

const AiReviewSection: React.FC<Props> = ({
  result,
  isLoading,
  error,
  onRefresh,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="ai-review-section">
      {/* 헤더 - 클릭으로 토글 */}
      <div
        className="ai-review-section-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-left">
          <Sparkles size={16} className="header-icon" />
          <span className="header-title">AI 코드 리뷰</span>
          {result && (
            <span className="issue-count">
              {result.reviews.length > 0
                ? `${result.reviews.length}개 이슈`
                : '이슈 없음'}
            </span>
          )}
          {isLoading && <span className="loading-text">분석 중...</span>}
        </div>
        <div className="header-right">
          <button
            className="header-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            title="다시 분석"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
          <button
            className="header-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="닫기"
          >
            <X size={14} />
          </button>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* 콘텐츠 - 토글로 표시/숨김 */}
      {isExpanded && (
        <div className="ai-review-section-content">
          {isLoading ? (
            <div className="section-loading">
              <div className="loading-spinner"></div>
              <p>AI가 코드를 분석하고 있습니다...</p>
            </div>
          ) : error ? (
            <div className="section-error">
              <p>{error}</p>
              <button className="retry-btn" onClick={onRefresh}>
                <RefreshCw size={14} />
                다시 시도
              </button>
            </div>
          ) : result ? (
            <div className="section-results">
              {/* 요약 */}
              <div className="review-summary">
                <h4>요약</h4>
                <p>{result.summary}</p>
              </div>

              {/* 이슈 목록 */}
              {result.reviews.length > 0 ? (
                <div className="review-items">
                  <h4>발견된 이슈</h4>
                  {result.reviews.map((item, idx) => (
                    <AiReviewItem key={idx} item={item} />
                  ))}
                </div>
              ) : (
                <div className="no-issues">
                  <CheckCircle size={20} />
                  <span>발견된 이슈가 없습니다!</span>
                </div>
              )}

              {/* 베스트 프랙티스 */}
              {result.bestPractices.length > 0 && (
                <div className="best-practices">
                  <h4>베스트 프랙티스</h4>
                  <ul>
                    {result.bestPractices.map((practice, idx) => (
                      <li key={idx}>
                        <CheckCircle size={12} />
                        {practice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AiReviewSection;
