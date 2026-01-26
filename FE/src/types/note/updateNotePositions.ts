export interface UpdatedNotePositionItem {
  noteId: string;
  pointX: number;
  pointY: number;
}

export interface UpdateNotePositionsResponse {
  updated: UpdatedNotePositionItem[];
  failed: string[];      // 실패한 noteId 목록
  updatedAt: string;
}
