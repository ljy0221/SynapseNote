// src/types/note/updateNotePosition.ts
export interface UpdateNotePositionRequest {
  pointX: number;
  pointY: number;
}

export interface UpdateNotePositionResponse {
  noteId: string;
  pointX: number;
  pointY: number;
  updatedAt: string;
}
