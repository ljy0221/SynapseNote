// 블록 타입 (서버 명세 기준)
export type BookmarkBlockType = 'code' | 'text';

// 즐겨찾기된 블록 단일 항목
export interface BookmarkBlock {
  blockId: string;
  noteId: string;
  notePath: string;
  type: BookmarkBlockType;
  content: string;
  bookmark: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetBookmarkBlocksResponse {
  content: BookmarkBlock[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
