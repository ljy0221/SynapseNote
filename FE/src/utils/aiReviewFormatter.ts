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
    const { color, label, bg } = getSeverityInfo(item.severity);
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

    // [Fix] blockquote 제거하고 div로 변경 (중복 blockquote 방지)
    // [Fix] 뱃지 스타일 변경: 배경색(bg) + 글자색(color) + 테두리(color)
    // [Fix] Schema Compliance: Wrap inline elements (strong, text) in p tags. Divs should only contain blocks.
    // [Fix] Minify HTML to avoid whitespace text nodes between blocks, which might violate 'block+' schema.
    return `<div style="margin-bottom: 24px; padding-left: 16px; border-left: 4px solid ${color};">` +
        `<h3 style="margin: 0 0 8px 0; display: flex; align-items: center;">` +
        `<span style="background: ${bg}; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 8px; border: 1px solid ${color}; font-weight: bold;">${label}</span>` +
        `<span style="color: var(--font-color);">${item.category}</span>` +
        `${lineInfo}` +
        `</h3>` +
        `<div style="margin: 0; padding: 0;">` +
        `<p style="margin: 0 0 8px 0; white-space: pre-wrap; color: var(--font-color);"><strong>문제</strong>: ${item.issue}</p>` +
        `<div style="margin-top: 8px;">` +
        `<p style="margin: 0 0 4px 0; color: var(--font-color-sub);"><strong>제안:</strong></p>` +
        `<p style="margin: 0; white-space: pre-wrap; color: var(--font-color);">${suggestionHtml}</p>` +
        `${codeBlockHtml}` +
        `</div>` +
        `</div>` +
        `</div>`;
}

/**
 * CodeReviewResponse를 TipTap 에디터용 HTML 형식으로 변환
 */
export function formatReviewAsHtml(response: CodeReviewResponse): string {
    const parts: string[] = [];

    // 헤더
    parts.push(`<h1 style="margin-bottom: 24px;">코드 리뷰</h1>`);
    parts.push(`<blockquote><p><strong>언어</strong>: ${response.language} | <strong>분석 시간</strong>: ${new Date(response.reviewedAt).toLocaleString()}</p></blockquote>`);

    // 요약 섹션 제거됨


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

    // 개선 방안
    if (response.bestPractices.length > 0) {
        parts.push(`<h2 style="margin-bottom: 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">개선 방안</h2>`);
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
