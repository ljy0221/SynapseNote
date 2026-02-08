// src/types/note/updateNote.ts
export interface UpdateNoteRequest {
  title?: string;
  directoryPath?: string;
}

export interface UpdateNoteResponse {
  noteId: string;
  title: string;
  invitationUrl: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  createdAt: string;
  updatedAt: string;
}