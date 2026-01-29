export type InvitationRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface CreateInvitationResponse {
  invitationUrl: string;
  invitationCode: string;
  role: InvitationRole;
  expiresAt: string;
  createdAt: string;
}
