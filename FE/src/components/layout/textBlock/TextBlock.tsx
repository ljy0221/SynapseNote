// FE/src/components/layout/textBlock/TextBlock.tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import {
    Heading1,
    Heading2,
    Heading3,
    Bold,
    Italic,
    Strikethrough,
    Underline as UnderlineIcon,
    Highlighter,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Quote,
    Minus,
    Link as LinkIcon,
    Image as ImageIcon,
    Palette,
} from 'lucide-react';
import { BlockType } from '../../../pages/note/Note';
import BlockTypeMenu from '../blockTypeMenu/BlockTypeMenu';
import './TextBlock.css';
interface TextBlockProps {
    id: number;
    content: string;
    onUpdate: (id: number, content: string) => void;
    onAddBlockBelow: (afterId: number, type: BlockType) => void;
    onFocus: () => void;
    onDelete: (id: number) => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}
const TextBlock: React.FC<TextBlockProps> = ({
    id,
    content,
    onUpdate,
    onAddBlockBelow,
    onFocus,
    onDelete,
    draggable,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image,
            TextStyle,
            Color,
            Placeholder.configure({
                placeholder: '텍스트를 입력하세요...',
            }),
            Underline,
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onUpdate(id, editor.getHTML());
        },
        onFocus: () => {
            setIsFocused(true);
            onFocus();
        },
        onBlur: () => {
            setIsFocused(false);
        },
    });
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);
    useEffect(() => {
        if (!editor) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Backspace' && editor.isEmpty) {
                event.preventDefault();
                onDelete(id);
            }
        };
        editor.view.dom.addEventListener('keydown', handleKeyDown);
        return () => {
            editor.view.dom.removeEventListener('keydown', handleKeyDown);
        };
    }, [editor, id, onDelete]);
    if (!editor) {
        return null;
    }
    const addImage = () => {
        const url = window.prompt('이미지 URL을 입력하세요:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };
    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('링크 URL을 입력하세요:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };
    return (
        <div
            className={`text-block-wrapper ${isFocused ? 'is-focused' : ''}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div
                className="block-controls"
                draggable={draggable}
                onDragStart={onDragStart}
                title="드래그하여 이동"
            >
                <button
                    className="add-block-btn"
                    onClick={() => setShowMenu(!showMenu)}
                    title="블록 추가"
                >
                    +
                </button>
                <div className="drag-handle-icon">⋮⋮</div>
                {showMenu && (
                    <BlockTypeMenu
                        onSelect={(type) => {
                            onAddBlockBelow(id, type);
                            setShowMenu(false);
                        }}
                        onClose={() => setShowMenu(false)}
                    />
                )}
            </div>
            <div className="text-block-editor-container">
                {/* 포커스 시에만 툴바 표시 */}
                {isFocused && (
                    <div className="editor-toolbar">
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                                title="제목 1"
                            >
                                <Heading1 size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                                title="제목 2"
                            >
                                <Heading2 size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                                title="제목 3"
                            >
                                <Heading3 size={18} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                                title="굵게 (Ctrl+B)"
                            >
                                <Bold size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                                title="기울임 (Ctrl+I)"
                            >
                                <Italic size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                                title="취소선"
                            >
                                <Strikethrough size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                                title="밑줄 (Ctrl+U)"
                            >
                                <UnderlineIcon size={18} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                                className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
                                title="형광펜"
                            >
                                <Highlighter size={18} />
                            </button>
                            <div className="color-picker-wrapper">
                                <Palette size={18} />
                                <input
                                    type="color"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                                    title="텍스트 색상"
                                    className="color-picker-input"
                                />
                            </div>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                                title="왼쪽 정렬"
                            >
                                <AlignLeft size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                                title="가운데 정렬"
                            >
                                <AlignCenter size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                                title="오른쪽 정렬"
                            >
                                <AlignRight size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
                                title="양쪽 정렬"
                            >
                                <AlignJustify size={18} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                                title="글머리 기호 목록"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                                title="번호 목록"
                            >
                                <ListOrdered size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                                title="인용구"
                            >
                                <Quote size={18} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                                className="toolbar-btn"
                                title="구분선"
                            >
                                <Minus size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={setLink}
                                className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
                                title="링크"
                            >
                                <LinkIcon size={18} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={addImage}
                                className="toolbar-btn"
                                title="이미지 삽입"
                            >
                                <ImageIcon size={18} />
                            </button>
                        </div>
                    </div>
                )}
                <EditorContent editor={editor} className="editor-content" />
            </div>
        </div>
    );
};
export default TextBlock;