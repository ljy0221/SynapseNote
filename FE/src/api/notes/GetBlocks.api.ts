// src/api/notes/GetBlocks.api.ts
import { request } from '../request';

export interface BlockDetailResponse {
    id: string;
    noteId: string;
    blockId: string;
    type: 'text' | 'code';
    content: string;
    order: number;
    bookmark: boolean;
    language?: string;
    createdAt: string;
    updatedAt: string;
}

export const getBlocksApi = (
    noteId: string
): Promise<BlockDetailResponse[]> => {
    return request<BlockDetailResponse[]>(
        'get',
        `/v1/notes/${noteId}/blocks`
    );
};
