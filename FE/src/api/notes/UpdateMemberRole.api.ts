import { request } from '../request';
import type { UpdateMemberRoleResponse, NoteMemberRole } from '../../types/note/UpdateMemberRole';

export const updateMemberRoleApi = (
    noteId: string,
    targetMemberId: string,
    newRole: NoteMemberRole
): Promise<UpdateMemberRoleResponse> => {
    return request<UpdateMemberRoleResponse>('patch', `/v1/notes/${noteId}/members/${targetMemberId}`, {
        body: {
            role: newRole
        }
    });
};
