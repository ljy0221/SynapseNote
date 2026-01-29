/**
 * 노트 생성 요청 데이터 타입
 * BE: NoteCreateRequest.java 와 대응
 */
export interface CreateNoteRequest {
    title: string;          // @Size(max = 200)
    directoryPath: string;  // @Size(max = 500)
    pointX: number | null;  // Java Double -> null 가능성 고려
    pointY: number | null;  // Java Double -> null 가능성 고려
    content: string;
}
/**
 * 노트 생성 응답 데이터 타입 (예시)
 * BE에서 반환하는 DTO를 확인하여 수정 필요
 */
export interface CreateNoteResponse {
    noteId: string;
}