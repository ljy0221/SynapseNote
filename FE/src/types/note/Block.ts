// src/types/note/Block.ts
export type BlockType = 'text' | 'code';

export interface BlockData {
    id: number | string;
    type: BlockType;
    content: string;
    language?: string;  // code 타입일 때만 사용
}
