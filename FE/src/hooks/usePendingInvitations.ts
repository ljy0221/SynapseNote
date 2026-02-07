
import { useState, useEffect, useCallback } from 'react';
import { getPendingInvitationsApi } from '../api/notes/Invitation.api';

export const usePendingInvitations = (
    noteId: string | undefined,
    role: 'OWNER' | 'EDITOR' | 'VIEWER' | undefined
) => {
    const [pendingInvitesCount, setPendingInvitesCount] = useState<number>(0);

    const fetchPendingInvitations = useCallback(async () => {
        if (!noteId || role !== 'OWNER') {
            setPendingInvitesCount(0);
            return;
        }

        try {
            const res = await getPendingInvitationsApi(noteId);
            if (res && res.invitations) {
                // status가 REQUESTED인 것만 카운트 (가입 신청만)
                const requests = res.invitations.filter((inv) => inv.status === 'REQUESTED');
                setPendingInvitesCount(requests.length);
            }
        } catch (error) {
            console.error('[usePendingInvitations] Failed to fetch pending invitations:', error);
        }
    }, [noteId, role]);

    useEffect(() => {
        fetchPendingInvitations();
    }, [fetchPendingInvitations]);

    return {
        pendingInvitesCount,
        refreshPendingInvitations: fetchPendingInvitations,
    };
};
