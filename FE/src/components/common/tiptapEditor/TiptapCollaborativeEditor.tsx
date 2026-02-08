import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import './TiptapCollaborativeEditor.css';

interface TiptapCollaborativeEditorProps {
    yText: Y.Text;
    onUpdate?: (content: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

export const TiptapCollaborativeEditor = ({
    yText,
    onUpdate,
    onFocus,
    onBlur,
}: TiptapCollaborativeEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Collaboration.configure({
                document: yText.doc!,
                fragment: yText as any, // Y.Text behaves as a fragment here
            }),
        ],
        onUpdate: ({ editor }) => {
            onUpdate?.(editor.getText());
        },
        onFocus: () => {
            onFocus?.();
        },
        onBlur: () => {
            onBlur?.();
        },
        editorProps: {
            attributes: {
                class: 'tiptap-collaborative-editor',
            },
        },
    });

    return <EditorContent editor={editor} />;
};
