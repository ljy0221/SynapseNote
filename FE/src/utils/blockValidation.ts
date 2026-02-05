import { BlockData } from '../types/note/Block';

/**
 * 블록이 현재 문서에 존재하는지 확인
 */
export const isBlockExists = (
    blockId: number | string,
    blocks: BlockData[]
): boolean => {
    return blocks.some(b => b.id === blockId);
};

/**
 * 안전한 다음 포커스 블록 찾기
 * 동시 삭제 시나리오에서 안전한 폴백 제공
 */
export const findSafeNextFocus = (
    currentId: number | string,
    blocks: BlockData[]
): number | string | null => {
    const currentIndex = blocks.findIndex(b => b.id === currentId);

    if (currentIndex === -1) {
        // 현재 블록이 없으면 첫 번째 블록 반환
        return blocks[0]?.id || null;
    }

    // 이전 블록 우선
    if (currentIndex > 0) {
        return blocks[currentIndex - 1].id;
    }

    // 다음 블록
    if (blocks.length > currentIndex + 1) {
        return blocks[currentIndex + 1].id;
    }

    return null;
};
