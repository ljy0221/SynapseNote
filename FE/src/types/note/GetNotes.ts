// src/types/note/GetNotes.ts
export type NoteRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface NoteListItem {
  noteId: string;        // ⭐ 유일 식별자
  userId: string;        // ⭐ 소유자
  title: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

export interface GetNotesResponse {
  content: NoteListItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

