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
    /**
     * 노트 상세 정보(캐시용) 업데이트
     */
    updateNoteMetadata: (noteId: string, metadata: Partial<NoteListItem>) => void;
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
                return diff > 3000;
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
        }),
        {
            name: 'note-storage', // localStorage key
        }
    )
);
