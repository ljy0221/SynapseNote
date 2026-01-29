export type BookmarkRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface BookmarkNoteItem {
  noteId: string;
  title: string;
  directoryPath: string;
  role: BookmarkRole;
  favoritedAt: string;
  updatedAt: string;
}

export interface BookmarkPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface GetBookmarksResponse {
  notes: BookmarkNoteItem[];
  pagination: BookmarkPagination;
}
