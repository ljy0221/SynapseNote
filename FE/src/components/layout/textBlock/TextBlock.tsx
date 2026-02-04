// FE/src/components/layout/textBlock/TextBlock.tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
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
import './TextBlock.css';

interface TextBlockProps {
    id: number | string;
    content: string;
    onUpdate: (id: number | string, content: string) => void;
    onFocus: () => void;
    onDelete: (id: number | string) => void;
    // Native DnD props removed
    // draggable?: boolean;
    // onDragStart?: (e: React.DragEvent) => void;
    // onDragOver?: (e: React.DragEvent) => void;
    // onDrop?: (e: React.DragEvent) => void;

    // Framer Motion controls
    dragControls?: any; // DragControls type from framer-motion (using any to avoid deep imports if strictly needed)
    isFocused?: boolean; // [추가]
    onContextMenu?: (e: React.MouseEvent) => void; // [New]
}

// 색상 팔레트
const TEXT_COLORS = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
    '#0000ff', '#9900ff', '#ff00ff', '#ff6666', '#ffcc66',
];

// Tab 키 확장
const TabHandler = Extension.create({
    name: 'tabHandler',
    addKeyboardShortcuts() {
        return {
            Tab: () => {
                this.editor.commands.insertContent('\t');
                return true;
            },
            'Shift-Tab': () => {
                return true;
            },
        };
    },
});
const TextBlock: React.FC<TextBlockProps> = ({
    id,
    content,
    onUpdate,
    onFocus,
    onDelete,
    // draggable,
    // onDragStart,
    // onDragOver,
    // onDrop,
    dragControls,
    isFocused: shouldFocus, // [추가] prop 이름 충돌 방지를 위해 별칭 사용
    onContextMenu, // [New]
}) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showColorPicker, setShowColorPicker] = React.useState(false);

    // 링크 모달 상태
    const [showLinkModal, setShowLinkModal] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState('');

    // Force update trigger
    const [, setUpdateTrigger] = React.useState(0);

    // 이미지 업로드 상태
    const [isUploading, setIsUploading] = React.useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                // @ts-ignore - Some versions include these, some don't. Explicitly disable to avoid duplicates.
                link: false,
                // @ts-ignore
                underline: false,
                // @ts-ignore - Disable Gapcursor/Dropcursor to prevent "ghost lines"
                gapcursor: false,
                // @ts-ignore
                dropcursor: false,
            }),
            Image,
            TextStyle,
            Color,
            Placeholder.configure({
                placeholder: '빈 블록',
            }),
            Underline,
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            TabHandler,
        ],
        content: content,
        onTransaction: () => {
            // Force re-render on every transaction to update toolbar state immediately
            // Tiptap's useEditor hook usually handles this, but sometimes state updates lag
            // forcing a React state update ensures the toolbar re-renders with correct isActive checks.
            setIsFocused(true);
            // Using a dummy state or just ensuring existing state is set could work,
            // or simply relying on useEditor's internal update.
            // If useEditor isn't triggering re-render, we might need a forceUpdate.
            // However, `editor` instance itself doesn't change, but its state does.
            // useEditor should trigger re-renders on state changes.
            // If not, we can use a forceUpdate mechanism.
        },
        onSelectionUpdate: ({ editor }) => {
            // 확실하게 상태 업데이트를 트리거하기 위해 forceUpdate 패턴 사용
            // 여기서는 간단히 editor 상태가 변경되었음을 알림
            // 그러나 useEditor는 내부적으로 상태 관리를 함.
            // 문제는 isActive 체크가 렌더링 사이클에 반영되지 않는 것.
            // setState를 호출하여 컴포넌트 리렌더링 유도
            setUpdateTrigger(prev => prev + 1);
        },
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

    // [추가] 외부에서 포커스 요청 시 에디터 포커스
    useEffect(() => {
        if (shouldFocus && editor && !editor.isFocused) {
            editor.commands.focus();
        }
    }, [shouldFocus, editor]);
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);
    if (!editor) {
        return null;
    }
    // ========================================
    // 이미지 업로드 (백엔드 업로드 방식)
    // ========================================
    const addImage = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            setIsUploading(true);

            try {
                // 1. 백엔드에서 업로드 URL 요청
                const uploadUrlResponse = await fetch('/api/images/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                    }),
                });

                if (!uploadUrlResponse.ok) {
                    throw new Error('업로드 URL을 받지 못했습니다.');
                }

                const { uploadUrl, imageUrl } = await uploadUrlResponse.json();

                // 2. 해당 URL로 파일 업로드
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });

                if (!uploadResponse.ok) {
                    throw new Error('이미지 업로드에 실패했습니다.');
                }

                // 3. 에디터에 이미지 삽입
                editor.chain().focus().setImage({ src: imageUrl }).run();

            } catch (error) {
                console.error('이미지 업로드 실패:', error);
                // alert('이미지 업로드에 실패했습니다.');
            } finally {
                setIsUploading(false);
                setTimeout(() => {
                    editor.commands.focus();
                    setIsFocused(true);
                }, 100);
            }
        };

        input.click();
    };
    // ========================================
    // 링크 모달 열기
    // ========================================
    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setShowLinkModal(true);
    };
    // 링크 적용
    const applyLink = () => {
        if (linkUrl.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        }
        setShowLinkModal(false);
        setLinkUrl('');
    };
    // 링크 모달 닫기
    const closeLinkModal = () => {
        setShowLinkModal(false);
        setLinkUrl('');
        editor.commands.focus();
    };
    return (
        <div
            className={`text-block-wrapper ${isFocused ? 'is-focused' : ''}`}
            // onDragOver={onDragOver}
            // onDrop={onDrop}
            onContextMenu={onContextMenu} // [New]
        >
            <div className="block-controls">
                <div
                    className="drag-handle-icon"
                    onPointerDown={(e) => dragControls?.start(e)}
                    title="드래그하여 이동"
                    style={{ touchAction: 'none' }} // Framer motion recommendation for touch devices
                >
                    ⋮⋮
                </div>
            </div>
            <div className="text-block-editor-container">
                {/* 포커스 시에만 툴바 표시 */}
                {isFocused && (
                    <div className="editor-toolbar">


                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                                title="제목 1"
                            >
                                <Heading1 size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                                title="제목 2"
                            >
                                <Heading2 size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                                title="제목 3"
                            >
                                <Heading3 size={16} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleBold().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                                title="굵게 (Ctrl+B)"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleItalic().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                                title="기울임 (Ctrl+I)"
                            >
                                <Italic size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleStrike().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                                title="취소선"
                            >
                                <Strikethrough size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleUnderline().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                                title="밑줄 (Ctrl+U)"
                            >
                                <UnderlineIcon size={16} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
                                title="형광펜"
                            >
                                <Highlighter size={16} />
                            </button>
                            <div
                                className="color-picker-wrapper"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <button
                                    className="toolbar-btn"
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    title="텍스트 색상"
                                >
                                    <Palette size={16} />
                                </button>
                                {showColorPicker && (
                                    <div className="color-palette">
                                        {TEXT_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                className="color-swatch"
                                                style={{ backgroundColor: color }}
                                                onClick={() => {
                                                    editor.chain().focus().setColor(color).run();
                                                    setShowColorPicker(false);
                                                    setUpdateTrigger(prev => prev + 1);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('left').run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                                title="왼쪽 정렬"
                            >
                                <AlignLeft size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('center').run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                                title="가운데 정렬"
                            >
                                <AlignCenter size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('right').run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                                title="오른쪽 정렬"
                            >
                                <AlignRight size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
                                title="양쪽 정렬"
                            >
                                <AlignJustify size={16} />
                            </button>
                        </div>
                        <div className="toolbar-divider" />
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleBulletList().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                                title="글머리 기호 목록"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleOrderedList().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                                title="번호 목록"
                            >
                                <ListOrdered size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleBlockquote().run(); setUpdateTrigger(prev => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                                title="인용구"
                            >
                                <Quote size={16} />
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
                                <Minus size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={setLink}
                                className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
                                title="링크"
                            >
                                <LinkIcon size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={addImage}
                                className="toolbar-btn"
                                title="이미지 삽입"
                            >
                                <ImageIcon size={16} />
                            </button>
                        </div>
                    </div>
                )}
                <EditorContent editor={editor} className="editor-content" />
                {/* 링크 입력 모달 */}
                {showLinkModal && (
                    <div className="link-modal-overlay" onClick={closeLinkModal}>
                        <div className="link-modal" onClick={(e) => e.stopPropagation()}>
                            <h4>🔗 링크 URL 입력</h4>
                            <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') applyLink();
                                    if (e.key === 'Escape') closeLinkModal();
                                }}
                            />
                            <div className="link-modal-buttons">
                                <button className="link-modal-apply" onClick={applyLink}>
                                    적용
                                </button>
                                <button className="link-modal-cancel" onClick={closeLinkModal}>
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* 업로드 중 표시 */}
                {isUploading && (
                    <div className="upload-overlay">
                        <div className="upload-spinner">이미지 업로드 중...</div>
                    </div>
                )}
            </div>

        </div>
    );
};
export default TextBlock;