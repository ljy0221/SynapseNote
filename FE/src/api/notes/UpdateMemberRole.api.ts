import { request } from '../request';
import type { NoteMemberRole, UpdateMemberRoleResponse } from '../../types/note/GetNoteMembers';

export const updateMemberRoleApi = (noteId: string, memberId: string, role: NoteMemberRole): Promise<UpdateMemberRoleResponse> => {
    return request<UpdateMemberRoleResponse>('patch', `/v1/notes/${noteId}/members/${memberId}/role`, {
        body: { role }
    });
};
