import { request } from '../request';
import type { CreateInvitationResponse } from '../../types/note/CreateInvitation';

export const createInvitationApi = (noteId: string): Promise<CreateInvitationResponse> => {
    return request<CreateInvitationResponse>('post', `/v1/notes/${noteId}/invitations`, {
        body: {
            invitedEmail: null,
            role: "EDITOR"
        }
    });
};
