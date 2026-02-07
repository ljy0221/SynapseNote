import type { CodeReviewResponse, ReviewItem } from '../types/ai/CodeReview';
import DOMPurify from 'dompurify';

/**
 * 심각도에 따른 이모지와 라벨 반환 (TipTap 호환)
 */
function getSeverityInfo(severity: string): { emoji: string; label: string } {
    switch (severity.toLowerCase()) {
        case 'critical':
        case 'error':
            return { emoji: '🚨', label: 'Error' };
        case 'warning':
            return { emoji: '⚠️', label: 'Warning' };
        case 'info':
        case 'suggestion':
            return { emoji: '💡', label: 'Info' };
        default:
            return { emoji: '✅', label: 'Check' };
    }
}

/**
 * HTML 이스케이프 헬퍼
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 리뷰 아이템을 TipTap 호환 HTML 형식으로 변환 (인라인 스타일 제거)
 */
function formatReviewItemHtml(item: ReviewItem): string {
    const { emoji, label } = getSeverityInfo(item.severity);
    const lineInfo = item.lineNumber ? ` (Line ${item.lineNumber})` : '';

    let parts: string[] = [];

    // 헤더: 이모지와 라벨
    parts.push(`<h3>${emoji} ${label} - ${item.category}${lineInfo}</h3>`);

    // 문제점
    parts.push(`<p><strong>문제:</strong> ${escapeHtml(item.issue)}</p>`);

    // 제안
    parts.push(`<p><strong>제안:</strong> ${escapeHtml(item.suggestion)}</p>`);

    // 제안 코드 (blockquote로 감싸서 표현)
    if (item.suggestionCode) {
        parts.push(`<p><strong>제안 코드:</strong></p>`);
        parts.push(`<blockquote><p>${escapeHtml(item.suggestionCode)}</p></blockquote>`);
    }

    parts.push(`<hr>`);

    return parts.join('');
}

/**
 * CodeReviewResponse를 TipTap 호환 HTML 형식으로 변환 (인라인 스타일 제거)
 */
export function formatReviewAsHtml(response: CodeReviewResponse): string {
    const parts: string[] = [];

    // 헤더
    parts.push(`<h1>🤖 AI 코드 리뷰</h1>`);
    parts.push(`<p><strong>언어:</strong> ${response.language}</p>`);
    parts.push(`<p><strong>분석 시간:</strong> ${new Date(response.reviewedAt).toLocaleString('ko-KR')}</p>`);
    parts.push(`<hr>`);

    // 요약
    parts.push(`<h2>📋 요약</h2>`);
    const summaryLines = response.summary.split('\n').filter(line => line.trim());
    summaryLines.forEach(line => {
        parts.push(`<p>${escapeHtml(line.trim())}</p>`);
    });

    // 발견된 이슈
    parts.push(`<h2>🔍 발견된 이슈</h2>`);
    if (response.reviews.length > 0) {
        response.reviews.forEach((item) => {
            parts.push(formatReviewItemHtml(item));
        });
    } else {
        parts.push(`<p>✅ 코드에서 특별한 문제점이 발견되지 않았습니다.</p>`);
    }

    // 개선 방향
    if (response.bestPractices.length > 0) {
        parts.push(`<h2>✨ 개선 방향</h2>`);
        parts.push(`<ul>`);
        response.bestPractices.forEach((practice) => {
            parts.push(`<li>${escapeHtml(practice)}</li>`);
        });
        parts.push(`</ul>`);
    }

    const rawHtml = parts.join('');

    console.log('[AI Review] Generated HTML:', rawHtml.substring(0, 500)); // Debug log

    // DOMPurify로 정제 - 모든 텍스트 스타일 허용
    const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'hr', 'p', 'ul', 'ol', 'li', 'br', 'strong', 'em', 's', 'u', 'mark', 'span', 'blockquote'],
        ALLOWED_ATTR: ['style', 'data-color'], // Allow style and data-color attributes
    });

    console.log('[AI Review] Sanitized HTML:', sanitized.substring(0, 500)); // Debug log

    return sanitized;
}
