import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorSettings {
    fontSize: number;
    tabSize: number;
    lineWrapping: boolean;
    lineNumbers: boolean;
    autoComplete: boolean;
}

interface CodeEditorState {
    // 에디터 설정만 관리 (인스턴스는 컴포넌트 로컬 상태로 관리)
    settings: EditorSettings;

    // Actions
    updateSettings: (settings: Partial<EditorSettings>) => void;
}

export const useCodeEditorStore = create<CodeEditorState>()(
    persist(
        (set) => ({
            settings: {
                fontSize: 15,
                tabSize: 4,
                lineWrapping: false,
                lineNumbers: true,
                autoComplete: true,
            },

            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),
        }),
        {
            name: 'code-editor-settings',
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);
