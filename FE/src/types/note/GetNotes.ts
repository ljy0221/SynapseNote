// src/types/note/GetNotes.ts
export type NoteRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface NoteListItem {
  noteId: string;        //  유일 식별자
  memberId: string;        //  소유자
  title: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  createdAt: number; // string -> number로 변경
  updatedAt: number;
  // AI 요약 관련 캐시 필드
  summary?: string;
  summaryStyle?: string;
  summaryUpdatedAt?: string;
}

export interface GetNotesResponse {
  content: NoteListItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

