export type NoteMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface UpdateMemberRoleResponse {
  memberId: string;
  email: string;
  name: string;
  role: NoteMemberRole;
  updatedAt: string;
}
