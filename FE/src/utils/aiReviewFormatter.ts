import type { CodeReviewResponse, ReviewItem } from '../types/ai/CodeReview';
import DOMPurify from 'dompurify';

/**
 * 심각도에 따른 이모지 반환
 */
function getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
        case 'critical':
        case 'error':
            return '🔴';
        case 'warning':
            return '🟡';
        case 'info':
        case 'suggestion':
            return '🔵';
        default:
            return '⚪';
    }
}

/**
 * 리뷰 아이템을 HTML 형식으로 변환
 */
function formatReviewItemHtml(item: ReviewItem, index: number): string {
    const emoji = getSeverityEmoji(item.severity);
    const lineInfo = item.lineNumber ? ` (Line ${item.lineNumber})` : '';

    return `<h3>${emoji} ${index + 1}. ${item.category}${lineInfo}</h3><p><strong>문제</strong>: ${item.issue}</p><p><strong>제안</strong>: ${item.suggestion}</p>`;
}

/**
 * CodeReviewResponse를 TipTap 에디터용 HTML 형식으로 변환
 */
export function formatReviewAsHtml(response: CodeReviewResponse): string {
    const parts: string[] = [];

    // 헤더
    parts.push(`<h1>🤖 AI 코드 리뷰</h1>`);
    parts.push(`<blockquote><p><strong>언어</strong>: ${response.language} | <strong>분석 시간</strong>: ${new Date(response.reviewedAt).toLocaleString()}</p></blockquote>`);

    // 요약
    parts.push(`<h2>📋 요약</h2>`);
    parts.push(`<p>${response.summary}</p>`);

    // 발견된 이슈
    if (response.reviews.length > 0) {
        parts.push(`<h2>🔍 발견된 이슈</h2>`);
        response.reviews.forEach((item, index) => {
            parts.push(formatReviewItemHtml(item, index));
        });
    } else {
        parts.push(`<h2>✅ 발견된 이슈 없음</h2>`);
        parts.push(`<p>코드에서 특별한 문제점이 발견되지 않았습니다.</p>`);
    }

    // 베스트 프랙티스
    if (response.bestPractices.length > 0) {
        parts.push(`<h2>💡 베스트 프랙티스</h2>`);
        parts.push(`<ul>`);
        response.bestPractices.forEach((practice) => {
            parts.push(`<li>✓ ${practice}</li>`);
        });
        parts.push(`</ul>`);
    }

    const rawHtml = parts.join('');
    return DOMPurify.sanitize(rawHtml);
}
