/**
 * 노트 생성 요청 데이터 타입
 * BE: NoteCreateRequest.java 와 대응
 */
export interface CreateNoteRequest {
  id: string;
  title: string;
  invitationUrl: string;
  directoryPath: string;
}

export interface CreateNoteResponse {
  noteId: string;
  memberId: string;
  title: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}
