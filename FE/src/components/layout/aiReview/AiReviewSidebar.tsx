// src/components/layout/aiReview/AiReviewSidebar.tsx

import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import AiReviewItem from './AiReviewItem';
import type { CodeReviewResponse } from '../../../types/ai/CodeReview';
import { requestCodeReview, DEFAULT_REVIEW_REQUEST } from '../../../api/ai/AiCodeReview.api';
import './AiReviewSidebar.css';

interface Props {
  noteId: string;
  blockId: string;
  language: string;
  onClose: () => void;
}

const AiReviewSidebar: React.FC<Props> = ({ noteId, blockId, language, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<CodeReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await requestCodeReview(noteId, blockId, DEFAULT_REVIEW_REQUEST);
      setResult(response);
    } catch (err: any) {
      console.error('AI Review failed:', err);
      setError(err.response?.data?.message || err.message || 'AI 리뷰 요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [noteId, blockId]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="ai-review-backdrop" onClick={onClose}></div>

      {/* 사이드바 */}
      <aside className="ai-review-sidebar">
        <header className="ai-review-header">
          <div className="header-title-wrapper">
            <Sparkles size={18} className="header-icon" />
            <h2>AI 코드 리뷰</h2>
            <span className="language-badge">{language}</span>
          </div>
          <button className="ai-review-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </header>

        <div className="ai-review-content">
          {isLoading ? (
            <div className="ai-review-loading">
              <div className="loading-spinner"></div>
              <p>AI가 코드를 분석하고 있습니다...</p>
            </div>
          ) : error ? (
            <div className="ai-review-error">
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchReview}>
                <RefreshCw size={16} />
                다시 시도
              </button>
            </div>
          ) : result ? (
            <div className="ai-review-results">
              {/* 요약 */}
              <div className="review-summary">
                <h3>요약</h3>
                <p>{result.summary}</p>
              </div>

              {/* 이슈 목록 */}
              {result.reviews.length > 0 ? (
                <div className="review-items">
                  <h3>발견된 이슈 ({result.reviews.length})</h3>
                  {result.reviews.map((item, idx) => (
                    <AiReviewItem key={idx} item={item} />
                  ))}
                </div>
              ) : (
                <div className="no-issues">
                  <CheckCircle size={24} />
                  <p>발견된 이슈가 없습니다!</p>
                </div>
              )}

              {/* 개선 방향 */}
              {result.bestPractices.length > 0 && (
                <div className="best-practices">
                  <h3>개선 방향</h3>
                  <ul>
                    {result.bestPractices.map((practice, idx) => (
                      <li key={idx}>
                        <CheckCircle size={14} />
                        {practice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 다시 분석 버튼 */}
              <button className="review-again-btn" onClick={fetchReview}>
                <RefreshCw size={16} />
                다시 분석
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};

export default AiReviewSidebar;
