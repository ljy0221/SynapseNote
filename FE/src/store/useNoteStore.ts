import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NoteStore {
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
}

export const useNoteStore = create(
    persist<NoteStore>(
        (set, get) => ({
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
        }),
        {
            name: 'note-storage', // localStorage key
        }
    )
);
