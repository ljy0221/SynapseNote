// 검색 결과 단일 노트
export interface SearchedNote {
  noteId: string;
  title: string;
  directoryPath: string;
  pointX: number | null;
  pointY: number | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// 공통 API 응답 래퍼
export interface SearchNotesResponse {
  success: boolean;
  code: string;
  message: string;
  path: string;
  data: SearchedNote[];
}
