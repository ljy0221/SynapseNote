import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension, Node } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
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
import { useModalStore } from '../../../store/useModalStore';
import './TextBlock.css';
import { BlockBookmarkButton } from '../../common/blockBookmarkButton/BlockBookmarkButton';
import { BlockEditorAvatar } from '../../common/blockEditorAvatar/BlockEditorAvatar';
import { AwarenessUser } from '../../../hooks/useYjsStore';
import { api } from '../../../api/axios';

// Div Node for Layout
const DivNode = Node.create({
    name: 'div',
    group: 'block',
    content: 'block*',
    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: element => element.getAttribute('style'),
                renderHTML: attributes => {
                    if (!attributes.style) {
                        return {}
                    }
                    return { style: attributes.style }
                },
            },
            class: {
                default: null,
                parseHTML: element => element.getAttribute('class'),
                renderHTML: attributes => {
                    if (!attributes.class) {
                        return {}
                    }
                    return { class: attributes.class }
                },
            },
        }
    },
    parseHTML() {
        return [{ tag: 'div' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', HTMLAttributes, 0];
    },
});

interface TextBlockProps {
    id: number | string;
    noteId: string;
    content?: string;
    bookmark?: boolean;
    onUpdate?: (id: number | string, content: string) => void;
    onFocus: () => void;
    onDelete: (id: number | string) => void;
    onToggleBookmark?: () => void;
    // Framer Motion controls
    dragControls?: any;
    isFocused?: boolean;
    onContextMenu?: (e: React.MouseEvent) => void;
    readOnly?: boolean;
    showBookmark?: boolean;
    editors?: AwarenessUser[];
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
    noteId,
    content,
    onUpdate,
    onFocus,
    onDelete: _onDelete,
    dragControls,
    isFocused: shouldFocus, // prop 이름 충돌 방지를 위해 별칭 사용
    onContextMenu,
    bookmark = false,
    onToggleBookmark,
    readOnly = false,
    showBookmark = true,
    editors = [],
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const { openModal } = useModalStore();

    // [New] Track IME composition state
    const isComposingRef = useRef(false);

    // [New] Debounce timer for Notion-style delayed updates
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdateRef = useRef<string | null>(null);

    const handleBookmark = () => {
        onToggleBookmark?.();
    };

    // 링크 모달 상태
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    // Force update trigger
    const [, setUpdateTrigger] = useState(0);

    // 이미지 업로드 상태
    const [isUploading, setIsUploading] = useState(false);

    // Ref to track whether a remote update is being applied (prevent onUpdate loop)
    const isRemoteUpdateRef = useRef(false);

    // [New] Use refs to avoid dependency issues
    const onUpdateRef = useRef(onUpdate);
    const onFocusRef = useRef(onFocus);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
        onFocusRef.current = onFocus;
    }, [onUpdate, onFocus]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                gapcursor: false,
                dropcursor: false,
            }),
            Image,
            TextStyle,
            Color,
            Placeholder.configure({ placeholder: '빈 블록' }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'custom-link' },
            }),
            Underline,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TabHandler,
            DivNode,
        ],
        content: (typeof content === 'string' && content.trim()) ? content : '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
            },
            handleDOMEvents: {
                compositionstart: () => {
                    isComposingRef.current = true;
                    return false;
                },
                compositionend: () => {
                    // Use setTimeout to ensure ProseMirror finishes processing
                    // the final composed character before we start the debounce
                    setTimeout(() => {
                        isComposingRef.current = false;
                        // If there's a pending update buffered during composition, start debounce
                        if (pendingUpdateRef.current !== null) {
                            if (updateTimerRef.current) {
                                clearTimeout(updateTimerRef.current);
                            }
                            updateTimerRef.current = setTimeout(() => {
                                if (pendingUpdateRef.current !== null) {
                                    onUpdateRef.current?.(id, pendingUpdateRef.current);
                                    pendingUpdateRef.current = null;
                                }
                            }, 300);
                        }
                    }, 0);
                    return false;
                },
            },
            handleClick: (view, pos, event) => {
                const attrs = view.state.doc.resolve(pos).marks().find(mark => mark.type.name === 'link')?.attrs;
                const link = attrs?.href;

                if (link && event.target instanceof HTMLAnchorElement) {
                    openModal('EXTERNAL_LINK_WARNING', {
                        url: link,
                        onConfirm: () => {
                            window.open(link, '_blank');
                        }
                    });
                    return true;
                }
                return false;
            }
        },
        onSelectionUpdate: () => {
            setUpdateTrigger(prev => prev + 1);
        },
        onUpdate: ({ editor }) => {
            // Skip if this update was triggered by applying remote content
            if (isRemoteUpdateRef.current) return;

            const html = editor.getHTML();
            pendingUpdateRef.current = html;

            // During IME composition, only buffer - don't start the debounce timer
            if (isComposingRef.current) {
                return;
            }

            // Start debounce timer
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
            updateTimerRef.current = setTimeout(() => {
                if (pendingUpdateRef.current !== null) {
                    onUpdateRef.current?.(id, pendingUpdateRef.current);
                    pendingUpdateRef.current = null;
                }
            }, 300);
        },
        onFocus: () => {
            setIsFocused(true);
            onFocusRef.current();
        },
        onBlur: () => {
            setIsFocused(false);

            // Flush pending update on blur
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
                updateTimerRef.current = null;
            }
            if (pendingUpdateRef.current !== null) {
                onUpdateRef.current?.(id, pendingUpdateRef.current);
                pendingUpdateRef.current = null;
            }
        },
    }, [noteId, id, openModal]);

    // 외부에서 포커스 요청 시 에디터 포커스
    useEffect(() => {
        if (shouldFocus && editor && !editor.isFocused) {
            editor.commands.focus();
        }
    }, [shouldFocus, editor]);

    // ReadOnly 상태 반영
    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [editor, readOnly]);

    // [New] Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
        };
    }, []);

    // Remote content sync: apply changes from other users when editor is not focused
    const prevContentRef = useRef(content);
    useEffect(() => {
        if (!editor || editor.isDestroyed) return;
        // Only react when content prop actually changed
        if (content === prevContentRef.current) return;
        prevContentRef.current = content;

        // Don't apply remote content while user is actively editing or composing
        if (editor.isFocused || isComposingRef.current) return;

        if (content) {
            isRemoteUpdateRef.current = true;
            editor.commands.setContent(content, { emitUpdate: false });
            isRemoteUpdateRef.current = false;
        }
    }, [content, editor]);
    if (!editor) {
        return null;
    }

    // ========================================
    // 이미지 업로드 (백엔드 업로드 방식)
    // ========================================
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

            // [Validation] 파일 유효성 검사
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

            if (!ALLOWED_TYPES.includes(file.type)) {
                alert('지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp)');
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }

            setIsUploading(true);

            try {
                // 1. 백엔드에서 업로드 URL 요청 (Presigned URL 발급)
                const uploadResponse = await api.post('/v1/images/upload-url', {
                    originalFileName: file.name,
                    contentType: file.type,
                });

                const { putUrl, key } = uploadResponse.data.data;

                // 2. 해당 URL로 파일 업로드 (S3에 직접 PUT)
                // Note: Use native fetch here to avoid sending App Auth headers to S3
                const s3UploadResponse = await fetch(putUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });

                if (!s3UploadResponse.ok) {
                    throw new Error('이미지 업로드에 실패했습니다.');
                }

                // 3. 이미지 조회 URL 요청
                // [WARNING] 현재 발급받는 URL은 Presigned URL로 유효기간이 있습니다.
                // 만료 후에는 이미지가 보이지 않을 수 있으므로, 장기적으로는
                // 백엔드 프록시 API 또는 Public Read 설정이 필요합니다.
                const readResponse = await api.get('/v1/images/read-url', {
                    params: { key },
                });

                const { getUrl } = readResponse.data.data;

                // 4. 에디터에 이미지 삽입
                editor.chain().focus().setImage({ src: getUrl }).run();

            } catch (error) {
                console.error('이미지 업로드 실패:', error);
                alert('이미지 업로드 중 오류가 발생했습니다.');
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
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');

        setLinkUrl(previousUrl);
        setLinkText(selectedText);
        setShowLinkModal(true);
    };

    // 링크 적용
    const applyLink = () => {
        if (linkUrl.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            if (linkText) {
                editor
                    .chain()
                    .focus()
                    .extendMarkRange('link')
                    .insertContent({
                        type: 'text',
                        text: linkText,
                        marks: [
                            {
                                type: 'link',
                                attrs: {
                                    href: linkUrl,
                                },
                            },
                        ],
                    })
                    .run();
            } else {
                editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
            }
        }
        setShowLinkModal(false);
        setLinkUrl('');
        setLinkText('');
    };

    // 링크 모달 닫기
    const closeLinkModal = () => {
        setShowLinkModal(false);
        setLinkUrl('');
        setLinkText('');
        editor.commands.focus();
    };

    return (
        <div
            id={id.toString()}
            className={`text-block-wrapper ${isFocused || shouldFocus ? 'is-focused' : ''} ${bookmark ? 'is-bookmarked' : ''} ${showBookmark ? 'has-bookmark' : ''}`}
            onContextMenu={onContextMenu}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="block-controls">
                <div
                    className="drag-handle-icon"
                    onPointerDown={(e) => dragControls?.start(e)}
                    title="드래그하여 이동"
                    style={{ touchAction: 'none' }}
                >
                    ⋮⋮
                </div>
            </div>

            <div className="text-block-editor-container">
                {/* 포커스 시에만 툴바 표시 (ReadOnly일 때는 숨김) */}
                {isFocused && !readOnly && (
                    <div className="editor-toolbar">
                        <div className="toolbar-group">
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                                title="제목 1"
                            >
                                <Heading1 size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                                title="제목 2"
                            >
                                <Heading2 size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setUpdateTrigger((prev: number) => prev + 1); }}
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
                                onClick={() => { editor.chain().focus().toggleBold().run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                                title="굵게 (Ctrl+B)"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleItalic().run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                                title="기울임 (Ctrl+I)"
                            >
                                <Italic size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleStrike().run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                                title="취소선"
                            >
                                <Strikethrough size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleUnderline().run(); setUpdateTrigger((prev: number) => prev + 1); }}
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
                                onClick={() => { editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run(); setUpdateTrigger((prev: number) => prev + 1); }}
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
                                                    setUpdateTrigger((prev: number) => prev + 1);
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
                                onClick={() => { editor.chain().focus().setTextAlign('left').run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                                title="왼쪽 정렬"
                            >
                                <AlignLeft size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('center').run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                                title="가운데 정렬"
                            >
                                <AlignCenter size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('right').run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                                title="오른쪽 정렬"
                            >
                                <AlignRight size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setUpdateTrigger((prev: number) => prev + 1); }}
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
                                onClick={() => { editor.chain().focus().toggleBulletList().run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                                title="글머리 기호 목록"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleOrderedList().run(); setUpdateTrigger((prev: number) => prev + 1); }}
                                className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                                title="번호 목록"
                            >
                                <ListOrdered size={16} />
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().toggleBlockquote().run(); setUpdateTrigger((prev: number) => prev + 1); }}
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
                            <div className="link-modal-header">
                                <h4>🔗 링크 생성</h4>
                            </div>

                            <div className="link-modal-field">
                                <label>표시할 텍스트</label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    placeholder="텍스트를 입력하세요"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') document.getElementById('link-url-input')?.focus();
                                        if (e.key === 'Escape') closeLinkModal();
                                    }}
                                />
                            </div>

                            <div className="link-modal-field">
                                <label>링크 주소</label>
                                <input
                                    id="link-url-input"
                                    type="text"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') applyLink();
                                        if (e.key === 'Escape') closeLinkModal();
                                    }}
                                />
                            </div>

                            <div className="link-modal-buttons">
                                <button className="link-modal-apply" onClick={applyLink}>
                                    링크 생성
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

            {/* Right Actions (Bookmark) */}
            <div className="block-actions-right">
                {showBookmark && (
                    <BlockBookmarkButton isBookmarked={bookmark} onClick={handleBookmark} />
                )}
            </div>

            {/* Show editor avatar if someone else is editing */}
            {editors.length > 0 && (
                <BlockEditorAvatar editors={editors} />
            )}

        </div>
    );
};

export default TextBlock;