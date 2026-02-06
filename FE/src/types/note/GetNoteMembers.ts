export type NoteMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface NoteMemberItem {
  memberId?: string; // [Optional]
  userId?: string;   // [New] Backend may use userId
  id?: string;       // [New] fallback
  email: string;
  name?: string;
  memberName?: string;
  profileImageUrl?: string;
  role: NoteMemberRole;
  joinedAt: string;
}

export interface GetNoteMembersResponse {
  members: NoteMemberItem[];
}

export interface UpdateMemberRoleResponse {
  memberId: string;
  role: NoteMemberRole;
}
