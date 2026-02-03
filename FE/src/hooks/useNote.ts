import { useState, useCallback, useEffect } from 'react';
import { getNoteDetailApi } from '../api/notes/GetNoteDetail.api';
import { useAuthStore } from '../store/useAuthStore';
import { NoteMemberRole, GetNoteDetailResponse } from '../types/note/GetNoteDetail';

interface UseNoteResult {
    note: GetNoteDetailResponse | null;
    role: NoteMemberRole | null;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export const useNote = (noteId?: string): UseNoteResult => {
    const { user } = useAuthStore();
    const [note, setNote] = useState<GetNoteDetailResponse | null>(null);
    const [role, setRole] = useState<NoteMemberRole | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchNote = useCallback(async () => {
        if (!noteId) {
            setNote(null);
            setRole(null);
            return;
        }

        setIsLoading(true);
        try {
            const data = await getNoteDetailApi(noteId);
            setNote(data);

            // Calculate Role
            if (user && data.owner && user.memberId === data.owner.memberId) {
                setRole('OWNER');
            } else if (user && data.members) {
                const member = data.members.find(m => m.memberId === user.memberId);
                if (member && member.role) {
                    setRole(member.role);
                } else {
                    setRole(null);
                }
            } else {
                setRole(null);
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err : new Error('Failed to fetch note'));
        } finally {
            setIsLoading(false);
        }
    }, [noteId, user]);

    useEffect(() => {
        fetchNote();
    }, [fetchNote]);

    return { note, role, isLoading, error, refresh: fetchNote };
};
