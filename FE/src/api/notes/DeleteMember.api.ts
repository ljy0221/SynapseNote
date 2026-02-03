import { request } from '../request';
import type { RemoveMemberResponse } from '../../types/note/RemoveMember';

export const deleteMemberApi = (noteId: string, memberId: string): Promise<RemoveMemberResponse> => {
    return request<RemoveMemberResponse>('delete', `/v1/notes/${noteId}/members/${memberId}`);
};
