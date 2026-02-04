import { request } from '../request';
import type { AcceptInvitationResponse } from '../../types/note/AcceptInvitation';

export const acceptInvitationApi = (token: string): Promise<AcceptInvitationResponse> => {
    return request<AcceptInvitationResponse>('post', `/v1/notes/invitations/${token}/accept`);
};
