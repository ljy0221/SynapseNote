export type NoteMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface NoteMemberItem {
  memberId: string;
  email: string;
  name: string;
  role: NoteMemberRole;
  joinedAt: string;
}

export interface GetNoteMembersResponse {
  members: NoteMemberItem[];
  totalMembers: number;
}
