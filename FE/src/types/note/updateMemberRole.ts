export type NoteMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface UpdateMemberRoleResponse {
  userId: string;
  email: string;
  name: string;
  role: NoteMemberRole;
  updatedAt: string;
}
