import { request } from '../request';
import type { GetNoteMembersResponse } from '../../types/note/GetNoteMembers';

export const getNoteMembersApi = (noteId: string): Promise<GetNoteMembersResponse> => {
    return request<GetNoteMembersResponse>('get', `/v1/notes/${noteId}/members`);
};
