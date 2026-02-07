import type { CodeReviewResponse, ReviewItem } from '../types/ai/CodeReview';
import DOMPurify from 'dompurify';

/**
 * 심각도에 따른 텍스트 반환 (이모지 제거)
 */
/**
 * 심각도에 따른 색상 및 텍스트 반환
 */
function getSeverityInfo(severity: string): { color: string; label: string; bg: string } {
    switch (severity.toLowerCase()) {
        case 'critical':
        case 'error':
            return { color: '#ef5350', label: 'Error', bg: '#ffebee' };
        case 'warning':
            return { color: '#ffca28', label: 'Warning', bg: '#fff8e1' };
        case 'info':
        case 'suggestion':
            return { color: '#42a5f5', label: 'Info', bg: '#e3f2fd' };
        default:
            return { color: '#66bb6a', label: 'Check', bg: '#e8f5e9' };
    }
}

/**
 * 리뷰 아이템을 HTML 형식으로 변환
 */
function formatReviewItemHtml(item: ReviewItem): string {
    const { color, label } = getSeverityInfo(item.severity);
    const lineInfo = item.lineNumber ? ` <span style="color: #666; font-size: 0.9em;">(Line ${item.lineNumber})</span>` : '';

    // 1. 인라인 코드 (`...`) 처리 (suggestion 텍스트 내)
    let suggestionHtml = item.suggestion.replace(/`([^`]+)`/g, '<code style="background: var(--color-sub); padding: 2px 4px; border-radius: 4px; font-family: monospace; color: var(--color-point); border: 1px solid var(--color-border);">$1</code>');

    // 2. 별도 코드 블록 (suggestionCode) 처리
    let codeBlockHtml = '';
    if (item.suggestionCode) {
        // HTML 이스케이프 (기본적인 것만)
        const safeCode = item.suggestionCode.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        codeBlockHtml = `<div style="background: var(--color-sub); padding: 12px; border-radius: 6px; border: 1px solid var(--color-border); margin: 8px 0;"><p style="font-family: monospace; color: var(--font-color); margin: 0; white-space: pre-wrap;">${safeCode}</p></div>`;
    }

    return `<div style="margin-bottom: 24px; padding-left: 16px; border-left: 4px solid ${color};">
        <h3 style="margin: 0 0 8px 0; display: flex; align-items: center;">
            <span style="background: ${color}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 8px;">${label}</span>
            <span style="color: var(--font-color);">${item.category}</span>
            ${lineInfo}
        </h3>
        <blockquote style="margin: 0; padding: 0; border: none; padding-left: 0;">
            <p style="margin: 0 0 8px 0; white-space: pre-wrap; color: var(--font-color);"><strong>문제</strong>: ${item.issue}</p>
            <div style="margin-top: 8px;">
                <strong style="display: block; margin-bottom: 4px; color: var(--font-color-sub);">제안:</strong>
                <div style="white-space: pre-wrap; color: var(--font-color);">${suggestionHtml}</div>
                ${codeBlockHtml}
            </div>
        </blockquote>
    </div>`;
}

/**
 * CodeReviewResponse를 TipTap 에디터용 HTML 형식으로 변환
 */
export function formatReviewAsHtml(response: CodeReviewResponse): string {
    const parts: string[] = [];

    // 헤더
    parts.push(`<h1 style="margin-bottom: 24px;">AI 코드 리뷰</h1>`);
    parts.push(`<blockquote><p><strong>언어</strong>: ${response.language} | <strong>분석 시간</strong>: ${new Date(response.reviewedAt).toLocaleString()}</p></blockquote>`);

    // 요약 (pre-wrap 적용 + 문장별 줄바꿈 + 인용구)
    const formattedSummary = response.summary.replace(/\. /g, '.<br>');
    parts.push(`<h2 style="margin-bottom: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">요약</h2>`);
    parts.push(`<blockquote><div style="white-space: pre-wrap; line-height: 1.8;">${formattedSummary}</div></blockquote>`);

    // 발견된 이슈
    if (response.reviews.length > 0) {
        parts.push(`<h2 style="margin-bottom: 24px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">발견된 이슈</h2>`);
        response.reviews.forEach((item) => {
            parts.push(formatReviewItemHtml(item));
        });
    } else {
        parts.push(`<h2 style="margin-bottom: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">발견된 이슈 없음</h2>`);
        parts.push(`<blockquote><p style="margin-bottom: 32px;">코드에서 특별한 문제점이 발견되지 않았습니다.</p></blockquote>`);
    }

    // 베스트 프랙티스
    if (response.bestPractices.length > 0) {
        parts.push(`<h2 style="margin-bottom: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">베스트 프랙티스</h2>`);
        parts.push(`<blockquote><ul style="margin: 0; padding-left: 20px;">`);
        response.bestPractices.forEach((practice) => {
            parts.push(`<li style="margin-bottom: 12px; white-space: pre-wrap; line-height: 1.6;">${practice}</li>`);
        });
        parts.push(`</ul></blockquote>`);
    }

    const rawHtml = parts.join('');
    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'div', 'span', 'blockquote', 'pre', 'code', 'ul', 'li', 'br', 'strong', 'em'],
        ALLOWED_ATTR: ['style', 'class'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
}
