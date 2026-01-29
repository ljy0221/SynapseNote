// src/types/bookmark/Bookmark.ts

export interface BookmarkedNote {
  id: string;
  title: string;
  directoryPath: string;
  pointX: number | null;
  pointY: number | null;
  createdBy: string;
  createdByName: string;
  bookmark: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetBookmarksResponse {
  content: BookmarkedNote[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
