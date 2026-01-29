import { Pagination } from '../common/pagination';

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
  notes: NoteListItem[];
  pagination: Pagination;
}
