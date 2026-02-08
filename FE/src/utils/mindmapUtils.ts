/**
 * 노드의 연결 수(Fan-out)에 따른 색상 변수를 반환합니다.
 * @param count 연결 수
 * @returns CSS 변수 문자열 (예: var(--node-color-master))
 */
export const getNodeColorByConnectionCount = (count: number = 0): string => {
    if (count >= 10) return 'var(--node-color-master)'; // Master
    if (count >= 7) return 'var(--node-color-high)'; // High
    if (count >= 4) return 'var(--node-color-mid)'; // Mid
    if (count >= 2) return 'var(--node-color-low)'; // Low
    return 'var(--node-color-dormant)'; // Dormant
};
