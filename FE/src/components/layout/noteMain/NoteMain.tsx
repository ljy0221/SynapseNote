// FE/src/components/layout/noteMain/NoteMain.tsx
import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useAutoScroll } from '../../../hooks/useAutoScroll'; // [New] Import
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import { NoteSideNav } from './NoteSideNav';
import { InviteLinkModal } from '../../common/modal/InviteLinkModal';
import { PermissionModal } from '../../common/modal/PermissionModal';
import { BlockData, BlockType } from '../../../pages/note/Note';
import './NoteMain.css';

interface NoteMainProps {
    title: string;
    onUpdateTitle: (newTitle: string) => void;
    blocks: BlockData[];
    onUpdateBlock: (id: number | string, content: string) => void;
    onAddBlockAfter: (afterId: number | string, type: BlockType) => void;
    onAddBlockAtEnd: (type: BlockType) => void;
    onDeleteBlock: (id: number | string) => void;
    onFocusBlock: (id: number | string) => void;
    focusedBlockId: number | string | null;
    onMoveBlock: (dragIndex: number, hoverIndex: number) => void;
    titleInputRef?: React.RefObject<HTMLInputElement>;
    noteId?: string;
}

const NoteMain: React.FC<NoteMainProps> = ({
    title,
    onUpdateTitle,
    blocks,
    onUpdateBlock,
    onAddBlockAfter,
    onAddBlockAtEnd,
    onDeleteBlock,
    onFocusBlock,
    focusedBlockId,
    onMoveBlock,
    titleInputRef,
    noteId
}) => {
    // [New] 초대 모달 상태
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    // [New] 권한 모달 상태
    const [isPermissionModalOpen, setIsPermissionModalOpen] = React.useState(false);

    // [New] Auto Animate for smooth reordering
    const [parent] = useAutoAnimate({ duration: 150 });

    // [New] Auto Scroll
    const layoutRef = React.useRef<HTMLDivElement>(null);
    const { handleDragOver: onAutoScroll, handleDragEnd: onAutoScrollEnd } = useAutoScroll(layoutRef);

    // DnD 및 로컬 블록 상태 관리
    // 실시간 드래그 효과를 위해 로컬 상태 사용
    const [localBlocks, setLocalBlocks] = React.useState<BlockData[]>(blocks);
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);
    const [initialDragIndex, setInitialDragIndex] = React.useState<number | null>(null);

    // 외부 props.blocks가 변경되면 로컬 상태 동기화 (드래그 중 아닐 때만)
    React.useEffect(() => {
        if (dragIndex === null) {
            setLocalBlocks(blocks);
        }
    }, [blocks, dragIndex]);

    // [New] Focus 변경 시 해당 블록으로 스크롤 이동 (Retry Logic 추가)
    React.useEffect(() => {
        if (focusedBlockId) {
            let attempt = 0;
            const scroll = () => {
                const element = document.getElementById(`block-${focusedBlockId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (attempt < 10) { // 최대 1초 대기 (100ms * 10)
                    attempt++;
                    setTimeout(scroll, 100);
                }
            };
            scroll();
        }
    }, [focusedBlockId]);

    const onDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        setDragIndex(index);
        setInitialDragIndex(index);
    };

    // 드래그 중 다른 블록 위로 올라갔을 때 미리 순서 바꾸기 (Visual Feedback)
    const onBlockDragOver = (e: React.DragEvent, hoverIndex: number) => {
        e.preventDefault(); // 드롭 허용을 위해 필수
        onAutoScroll(e); // [New] 자동 스크롤 트리거

        if (dragIndex === null || dragIndex === hoverIndex) return;

        // [New] Midpoint Check (Flickering 방지)
        const hoverBoundingRect = e.currentTarget.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = e.clientY - hoverBoundingRect.top;

        // 아래로 드래그 시: 타겟의 중앙을 넘어야 교체
        if (dragIndex < hoverIndex && clientOffset < hoverMiddleY) {
            return;
        }

        // 위로 드래그 시: 타겟의 중앙을 넘어야 교체
        if (dragIndex > hoverIndex && clientOffset > hoverMiddleY) {
            return;
        }

        // 순서 변경 로직
        const newBlocks = [...localBlocks];
        const draggedItem = newBlocks[dragIndex];

        // 배열에서 제거 후 새 위치에 삽입
        newBlocks.splice(dragIndex, 1);
        newBlocks.splice(hoverIndex, 0, draggedItem);

        setLocalBlocks(newBlocks);
        setDragIndex(hoverIndex);
    };

    const onDrop = () => {
        onAutoScrollEnd(); // [New] 스크롤 중단
        if (initialDragIndex !== null && dragIndex !== null && initialDragIndex !== dragIndex) {
            // 최종 변경 사항을 상위 컴포넌트(Yjs/Backend)에 반영
            onMoveBlock(initialDragIndex, dragIndex);
        }
        setDragIndex(null);
        setInitialDragIndex(null);
    };

    const renderBlock = (block: BlockData, index: number) => {
        const commonProps = {
            draggable: true,
            onDragStart: (e: React.DragEvent) => onDragStart(e, index),
            onDragOver: (e: React.DragEvent) => onBlockDragOver(e, index),
            onDrop: onDrop, // Drop은 index 필요 없음 (이미 dragIndex로 추적됨)
            isFocused: block.id === focusedBlockId,
            isDragging: index === dragIndex, // [New] 드래그 중인 블록 표시
        };
        switch (block.type) {
            case 'text':
                return (
                    <TextBlock
                        key={block.id}
                        {...commonProps}
                        id={block.id as any}
                        content={block.content}
                        onUpdate={onUpdateBlock as any}
                        onDelete={onDeleteBlock as any}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );
            case 'code':
                return (
                    <CodeBlock
                        key={block.id}
                        {...commonProps}
                        id={block.id as any}
                        noteId={noteId}
                        language={(block.language as any) || 'javascript'}
                        code={block.content}
                        onDelete={onDeleteBlock as any}
                        onChange={onUpdateBlock as any}
                        onFocus={() => onFocusBlock(block.id)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="note-main-layout"
            ref={layoutRef}
            onDragOver={(e) => {
                e.preventDefault();
                onAutoScroll(e);
            }}
        >
            <div className="note-paper-container">
                <div className="note-sidenav-area">
                    <NoteSideNav
                        onAddBlock={onAddBlockAtEnd}
                        onInvite={() => setIsInviteModalOpen(true)}
                        onPermission={() => setIsPermissionModalOpen(true)}
                    />
                </div>

                <div className="note-paper">
                    <header className="note-main-header">
                        <input
                            ref={titleInputRef}
                            className="note-main-title-input"
                            value={title}
                            onChange={(e) => onUpdateTitle(e.target.value)}
                            placeholder="제목 없음"
                        />
                    </header>
                    <div className="note-content-area" ref={parent}>
                        {localBlocks.map((block, index) => renderBlock(block, index))}
                        <div className="note-bottom-spacer" style={{ height: '30vh' }} />
                    </div>
                </div>
            </div>

            {/* 초대 링크 모달 */}
            <InviteLinkModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                noteId={noteId}
            />
            {/* 권한 관리 모달 */}
            <PermissionModal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                noteId={noteId}
            />
        </div >
    );
};

export default NoteMain;