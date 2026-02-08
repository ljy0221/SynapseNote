/** 히스토리 슬롯 정보 (백엔드 응답 구조에 맞춤) */
export interface SlotHistory {
  slotNumber: number;
  savedAt: string;
  isEmpty: boolean;
  content?: string; // 텍스트 블록일 경우
  properties?: {    // 코드 블록일 경우
    code: string;
    language: string;
    executionMode: string;
    version: string;
    [key: string]: any;
  };
}

/** 체크포인트(히스토리) 전체 조회 응답 데이터 (페이지네이션) */
export interface GetCheckpointsData {
  content: SlotHistory[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/** 
 * 체크포인트 전체 조회 응답 
 */
export interface GetCheckpointsResponse extends GetCheckpointsData { }

/** 코드 블록 - 복구를 위해 기존 정의 유지 또는 참조 */
export interface CodeBlock {
  id: string;
  language: string;
  version: string;
  executionMode: string;
  code: string;
  lastOutput?: string;
  lastExecutedAt?: string;
}
