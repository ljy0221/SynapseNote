import { request } from '../request';
import type { NoteMemberRole } from '../../types/note/GetNoteMembers';

interface UpdateMemberRoleResponse {
    memberId: string;
    role: NoteMemberRole;
}

export const updateMemberRoleApi = (noteId: string, memberId: string, role: NoteMemberRole): Promise<UpdateMemberRoleResponse> => {
    return request<UpdateMemberRoleResponse>('patch', `/v1/notes/${noteId}/members/${memberId}/role`, {
        body: { role }
    });
};
