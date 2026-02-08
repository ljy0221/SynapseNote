/** 노트 멤버 권한 */
export type NoteMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

/** 노트 멤버 (owner, members 공용) */
export interface NoteMember {
  memberId?: string;
  userId?: string;   // [New] fallback
  id?: string;
  email: string;
  name?: string;
  memberName?: string;
  role?: NoteMemberRole;
}

/** 노트 상세 응답 data */
export interface GetNoteDetailResponse {
  id: string;
  title: string;
  invitationUrl: string;
  directoryPath: string;

  owner: NoteMember;
  members: NoteMember[];

  createdAt: string;
  updatedAt: string;

  // AI 요약 필드
  summary?: string;
  summaryStyle?: string;
  summaryUpdatedAt?: string;

  blocks: any[]; // [추가] NoteDetail 에 이미 블록이 포함되어 있음
}
