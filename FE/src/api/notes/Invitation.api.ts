import { request } from '../request';

export interface PendingInvitationItem {
    id: string;
    invitedEmail: string;
    invitedBy: {
        memberId: string;
        name: string;
    };
    invitedMember?: {
        id: string;
        name: string;
        email: string;
        profileImageUrl?: string;
    };
    role: 'EDITOR' | 'VIEWER';
    status: 'PENDING' | 'REQUESTED';
    createdAt: string;
    expiresAt: string;
}

export interface GetPendingInvitationsResponse {
    invitations: PendingInvitationItem[];
}

export const getPendingInvitationsApi = (noteId: string): Promise<GetPendingInvitationsResponse> => {
    return request<GetPendingInvitationsResponse>('get', `/v1/notes/${noteId}/invitations`);
};

export const approveInvitationApi = (invitationId: string, role?: 'EDITOR' | 'VIEWER'): Promise<void> => {
    return request<void>('post', `/v1/notes/invitations/${invitationId}/approve`, {
        body: { role }
    });
};
