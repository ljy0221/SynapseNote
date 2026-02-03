import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorView } from '@codemirror/view';

interface EditorSettings {
    fontSize: number;
    tabSize: number;
    lineWrapping: boolean;
    lineNumbers: boolean;
    autoComplete: boolean;
}

interface CodeEditorState {
    // 에디터 설정
    settings: EditorSettings;

    // 에디터 인스턴스 참조 (블록 ID별)
    editorInstances: Map<string, EditorView>;

    // Actions
    updateSettings: (settings: Partial<EditorSettings>) => void;
    registerEditor: (blockId: string, view: EditorView) => void;
    unregisterEditor: (blockId: string) => void;
    getEditor: (blockId: string) => EditorView | undefined;
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
            },
            editorInstances: new Map(),

            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            registerEditor: (blockId, view) =>
                set((state) => {
                    const instances = new Map(state.editorInstances);
                    instances.set(blockId, view);
                    return { editorInstances: instances };
                }),

            unregisterEditor: (blockId) =>
                set((state) => {
                    const instances = new Map(state.editorInstances);
                    instances.delete(blockId);
                    return { editorInstances: instances };
                }),

            getEditor: (blockId) => get().editorInstances.get(blockId),
        }),
        {
            name: 'code-editor-settings',
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);
