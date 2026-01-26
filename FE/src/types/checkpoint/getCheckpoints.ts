/** 코드 블록 */
export interface CodeBlock {
  id: string;
  language: string;
  version: string;
  executionMode: string;
  code: string;
  lastOutput?: string;
  lastExecutedAt?: string;
}

/** 텍스트 블록 */
export interface TextBlock {
  id: string;
  content: string;
}

/** 체크포인트에 저장된 블록 */
export interface CheckpointBlock {
  type: 'CODE' | 'TEXT';
  codeBlock?: CodeBlock;
  textBlock?: TextBlock;
}

/** 체크포인트 아이템 */
export interface CheckpointItem {
  checkpointId: string;
  checkpoint: number;
  createdAt: string;
  block: CheckpointBlock;
}

/** 체크포인트 전체 조회 응답 */
export interface GetCheckpointsResponse {
  noteId: string;
  blockId: string;
  checkpointNum: number;
  checkpoints: CheckpointItem[];
}
