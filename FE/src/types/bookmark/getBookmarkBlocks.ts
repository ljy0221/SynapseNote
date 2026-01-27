// types/bookmark/getBookmarkBlocks.ts 
// 예시 타입 정의
export type BookmarkBlockType = 'TEXT' | 'CODE';

export interface BookmarkBlockItem {
  blockId: string;
  blockType: BookmarkBlockType;
  preview: string;
  noteId: string;
  noteTitle: string;
  favoritedAt: string;
}
