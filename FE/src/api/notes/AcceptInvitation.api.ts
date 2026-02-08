import { request } from '../request';


export const acceptInvitationApi = (token: string): Promise<void> => {
    return request<void>('post', `/v1/notes/invitations/${token}/request`);
};
