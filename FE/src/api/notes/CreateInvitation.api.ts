import { request } from '../request';
import type { CreateInvitationResponse } from '../../types/note/CreateInvitation';

export const createInvitationApi = (noteId: string, role: string = 'EDITOR', expirationSeconds?: number): Promise<CreateInvitationResponse> => {
    return request<CreateInvitationResponse>('post', `/v1/notes/${noteId}/invitations`, {
        body: {
            invitedEmail: null,
            role: role,
            expirationSeconds: expirationSeconds
        }
    });
};
