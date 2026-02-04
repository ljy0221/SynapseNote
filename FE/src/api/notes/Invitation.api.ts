import { request } from '../request';

export interface PendingInvitationItem {
    invitationId: string;
    invitedEmail: string;
    invitedBy: {
        memberId: string;
        name: string;
    };
    invitedMember?: {
        memberId: string;
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

export const approveInvitationApi = (invitationId: string): Promise<void> => {
    return request<void>('post', `/v1/notes/invitations/${invitationId}/approve`);
};
