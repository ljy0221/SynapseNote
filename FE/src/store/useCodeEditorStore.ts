import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language } from '../types/execution/ExecutionTypes';

interface EditorSettings {
    fontSize: number;
    tabSize: number;
    lineWrapping: boolean;
    lineNumbers: boolean;
    autoComplete: boolean;
    defaultLanguage: Language;
    executionTimeout: number; // milliseconds
}

interface CodeEditorState {
    // 에디터 설정만 관리 (인스턴스는 컴포넌트 로컬 상태로 관리)
    settings: EditorSettings;

    // 노트별 언어 설정 (noteId -> language)
    noteLanguages: Record<string, Language>;

    // 노트별 블럭별 언어 목록 (noteId -> blockId -> language)
    noteBlockLanguages: Record<string, Record<string, Language>>;

    // Actions
    updateSettings: (settings: Partial<EditorSettings>) => void;
    setNoteLanguage: (noteId: string, language: Language) => void;
    getNoteLanguage: (noteId: string) => Language | undefined;
    trackBlockLanguage: (noteId: string, blockId: string, language: Language) => void;
    hasMultipleLanguages: (noteId: string) => boolean;
    clearNoteLanguages: (noteId: string) => void;
}

export const useCodeEditorStore = create<CodeEditorState>()(
    persist(
        (set, get) => ({
            settings: {
                fontSize: 15,
                tabSize: 4,
                lineWrapping: false,
                lineNumbers: true,
                autoComplete: true,
                defaultLanguage: 'python',
                executionTimeout: 10000, // 10 seconds
            },

            noteLanguages: {},
            noteBlockLanguages: {},

            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            setNoteLanguage: (noteId, language) =>
                set((state) => ({
                    noteLanguages: { ...state.noteLanguages, [noteId]: language },
                })),

            getNoteLanguage: (noteId) => {
                const state = get();
                return state.noteLanguages[noteId] || state.settings.defaultLanguage;
            },

            trackBlockLanguage: (noteId, blockId, language) =>
                set((state) => {
                    const noteBlocks = state.noteBlockLanguages[noteId] || {};
                    const newNoteBlocks = {
                        ...noteBlocks,
                        [blockId]: language,
                    };

                    console.log(`[CodeEditor] Track block - Note: ${noteId}, Block: ${blockId}, Lang: ${language}`);

                    return {
                        noteBlockLanguages: {
                            ...state.noteBlockLanguages,
                            [noteId]: newNoteBlocks,
                        },
                    };
                }),

            hasMultipleLanguages: (noteId) => {
                const state = get();
                const noteBlocks = state.noteBlockLanguages[noteId];

                if (!noteBlocks || Object.keys(noteBlocks).length === 0) {
                    return false;
                }

                // 블럭별 언어를 수집하여 고유한 언어 개수 확인
                const languages = new Set(Object.values(noteBlocks));
                const hasMultiple = languages.size > 1;

                console.log(`[CodeEditor] Multi-lang check - Note: ${noteId}, Languages: [${Array.from(languages).join(', ')}], Multiple: ${hasMultiple}`);

                return hasMultiple;
            },

            clearNoteLanguages: (noteId) =>
                set((state) => {
                    const newNoteBlockLanguages = { ...state.noteBlockLanguages };
                    delete newNoteBlockLanguages[noteId];
                    return {
                        noteBlockLanguages: newNoteBlockLanguages,
                    };
                }),
        }),
        {
            name: 'code-editor-settings',
            version: 2, // 버전 업데이트로 마이그레이션 트리거
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                settings: state.settings,
                noteLanguages: state.noteLanguages,
                noteBlockLanguages: state.noteBlockLanguages,
            }),
            migrate: (persistedState: any, _version: number) => {
                // 이전 버전의 noteUsedLanguages 제거
                if (persistedState && 'noteUsedLanguages' in persistedState) {
                    console.log('[CodeEditor] Migrating from old storage format, removing noteUsedLanguages');
                    const { noteUsedLanguages, ...rest } = persistedState;
                    return rest;
                }
                return persistedState;
            },
        }
    )
);
