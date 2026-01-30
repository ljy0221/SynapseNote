export type InvitationRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface AcceptInvitationResponse {
  noteId: string;
  title: string;
  role: InvitationRole;
  joinedAt: string;
}
