// src/types/bookmark/Bookmark.ts

/** 즐겨찾기된 노트 (목록용) */
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
