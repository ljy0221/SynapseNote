// src/types/note/Block.ts
export type BlockType = 'text' | 'code';

export interface BlockData {
    id: number | string;
    type: BlockType;
    content: string;
    language?: string;  // code 타입일 때만 사용
    bookmark?: boolean; // 즐겨찾기 여부
    rawHtml?: string;   // 원본 HTML (AI 리뷰 등 포맷팅 보존용)
}
