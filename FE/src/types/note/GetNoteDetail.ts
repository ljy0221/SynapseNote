/** 노트 멤버 권한 */
export type NoteMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

/** 노트 멤버 (owner, members 공용) */
export interface NoteMember {
  memberId: string;
  email: string;
  name: string;
  role?: NoteMemberRole;
  // owner에는 role이 없으므로 optional
}

/** 노트 상세 응답 data */
export interface GetNoteDetailResponse {
  noteId: string;
  title: string;
  invitationUrl: string;
  directoryPath: string;

  owner: NoteMember;
  members: NoteMember[];

  createdAt: string;
  updatedAt: string;
}
