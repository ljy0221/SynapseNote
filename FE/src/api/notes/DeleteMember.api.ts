import { request } from '../request';

export const deleteMemberApi = (noteId: string, memberId: string): Promise<void> => {
    return request<void>('delete', `/v1/notes/${noteId}/members/${memberId}`);
};
