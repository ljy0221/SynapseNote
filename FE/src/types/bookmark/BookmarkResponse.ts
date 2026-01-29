// src/types/bookmark/BookmarkResponse.ts
import { BookmarkedNote } from './Bookmark';

/** 즐겨찾기 추가 응답 data */
export interface AddBookmarkResponse {
  noteId: string;
  isFavorite: true;
  favoritedAt: string;
}

/** 즐겨찾기 제거 응답 data */
export interface RemoveBookmarkResponse {
  noteId: string;
  isFavorite: false;
}

// src/types/bookmark/BookmarkResponse.ts

export interface GetBookmarksResponse {
  content: BookmarkedNote[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
