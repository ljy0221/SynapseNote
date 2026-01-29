// src/types/note/GetNotes.ts
export type NoteRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface NoteListItem {
  noteId: string;
  title: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  role: NoteRole;
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
