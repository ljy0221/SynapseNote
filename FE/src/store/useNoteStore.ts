import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NoteListItem } from '../types/note/GetNotes';

interface NoteStore {
    notes: NoteListItem[];
    setNotes: (notes: NoteListItem[] | ((prev: NoteListItem[]) => NoteListItem[])) => void;
    lastCreatedTime: number | null;
    /**
     * 노트 생성 가능 여부 확인
     * (마지막 생성 후 30초 지났는지 체크)
     */
    canCreateNote: () => boolean;
    /**
     * 마지막 생성 시간 업데이트
     */
    updateLastCreatedTime: () => void;
    updateNoteMetadata: (noteId: string, metadata: Partial<NoteListItem>) => void;
    /**
     * 로딩 상태(Fetching) 관리
     */
    fetchingIds: Record<string, boolean>;
    setFetchingId: (id: string, status: boolean) => void;
}

export const useNoteStore = create(
    persist<NoteStore>(
        (set, get) => ({
            notes: [],
            setNotes: (notesOrFn) => {
                if (typeof notesOrFn === 'function') {
                    set((state) => ({ notes: notesOrFn(state.notes) }));
                } else {
                    set({ notes: notesOrFn });
                }
            },
            lastCreatedTime: null,

            canCreateNote: () => {
                const { lastCreatedTime } = get();
                if (!lastCreatedTime) return true;

                const now = Date.now();
                const diff = now - lastCreatedTime;
                // 30초 (30000ms) 경과 확인
                return diff > 30000;
            },

            updateLastCreatedTime: () => {
                set({ lastCreatedTime: Date.now() });
            },

            updateNoteMetadata: (noteId, metadata) => {
                set((state) => ({
                    notes: state.notes.map((n) =>
                        n.noteId === noteId ? { ...n, ...metadata } : n
                    ),
                }));
            },

            fetchingIds: {},
            setFetchingId: (id, status) => {
                set((state) => ({
                    fetchingIds: { ...state.fetchingIds, [id]: status }
                }));
            },
        }),
        {
            name: 'note-storage', // localStorage key
            partialize: (state) => {
                // fetchingIds는 저장하지 않음 (새로고침 시 초기화 위함)
                const { fetchingIds, ...rest } = state;
                return rest as NoteStore;
            },
        }
    )
);
