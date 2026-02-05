import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import { NoteSideNav } from './NoteSideNav';
import { DraggableBlock } from './DraggableBlock'; // [New]
import { Reorder } from 'framer-motion'; // [New]
import { InviteLinkModal } from '../../common/modal/InviteLinkModal';
import { PermissionModal } from '../../common/modal/PermissionModal';
import { SummaryConfigModal } from '../../common/modal/SummaryConfigModal';
import { NoteSummary } from '../../common/noteSummary/NoteSummary';
import { BlockData, BlockType } from '../../../types/note/Block';
import type { SummaryStyle } from '../../../types/ai/NoteSummary';
import BlockContextMenu from '../../common/contextMenu/BlockContextMenu';
import './NoteMain.css';

interface NoteMainProps {
    title: string;
    onUpdateTitle: (newTitle: string) => void;
    blocks: BlockData[];
    onUpdateBlock: (id: number | string, content: string) => void;
    onAddBlockAfter: (afterId: number | string, type: BlockType, content?: string) => void;
    onAddBlockAtEnd: (type: BlockType) => void;
    onDeleteBlock: (id: number | string) => void;
    onFocusBlock: (id: number | string) => void;
    focusedBlockId: number | string | null;
    onMoveBlock: (dragIndex: number, hoverIndex: number) => void;
    titleInputRef?: React.RefObject<HTMLInputElement>;
    noteId?: string;
    // AI 요약 관련 props
    summary?: string;
    summaryStyle?: string;
    summaryUpdatedAt?: string;
    isSummaryLoading?: boolean;
    onGenerateSummary?: (style: SummaryStyle) => void;
    onToggleBookmark?: (blockId: number | string, currentStatus: boolean) => void;
    bookmarkedBlockIds?: Set<string>; // [New] 로컬 북마크 상태
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
    noteId,
    summary,
    summaryStyle,
    summaryUpdatedAt,
    isSummaryLoading,
    onGenerateSummary,
    onToggleBookmark,
    bookmarkedBlockIds
}) => {
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = React.useState(false);
    // [New] AI 요약 모달 상태
    const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);

    // [New] Context Menu State
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; blockId: string | number } | null>(null);

    // [New] Framer Motion Local State
    const [localBlocks, setLocalBlocks] = React.useState<BlockData[]>(blocks);
    const isDraggingRef = React.useRef(false); // [New] Track dragging state to prevent conflict with external updates

    // Sync props.blocks to localBlocks when props change (and not actively dragging)
    React.useEffect(() => {
        if (!isDraggingRef.current) {
            setLocalBlocks(blocks);
        }
    }, [blocks]);

    // DnD logic moved to Reorder.Group

    const handleDragEnd = (draggedBlockId: number | string) => {
        // Find old index in original props
        const oldIndex = blocks.findIndex(b => b.id === draggedBlockId);
        // Find new index in local state
        const newIndex = localBlocks.findIndex(b => b.id === draggedBlockId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            console.log(`[Reorder] Moved block ${draggedBlockId} from ${oldIndex} to ${newIndex}`);
            onMoveBlock(oldIndex, newIndex);
        }
    };

    // 디버깅: 실제 렌더링되는 블록 데이터 확인
    console.log("[NoteMain] Current blocks for rendering:", blocks);

    const handleContextMenu = (e: React.MouseEvent, blockId: string | number) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            blockId,
        });
    };

    const handleDeleteFromMenu = () => {
        if (contextMenu) {
            onDeleteBlock(contextMenu.blockId);
            setContextMenu(null);
        }
    };

    // Removed legacy native DnD handlers

    const renderBlock = (block: BlockData, index: number, dragControls: any) => {
        const commonProps = {
            dragControls: dragControls, // Passed from DraggableBlock
            isFocused: block.id === focusedBlockId,
            onContextMenu: (e: React.MouseEvent) => handleContextMenu(e, block.id),
        };

        const handleAiReviewResult = (htmlContent: string) => {
            const nextBlock = blocks[index + 1];
            // 다음 블록이 텍스트 블록이고 AI 리뷰 헤더로 시작하면 업데이트
            if (nextBlock && nextBlock.type === 'text' && nextBlock.content.startsWith('<h1>🤖 AI 코드 리뷰</h1>')) {
                onUpdateBlock(nextBlock.id, htmlContent);
            } else {
                // 아니면 새 블록 추가
                onAddBlockAfter(block.id, 'text', htmlContent);
            }
        };

        switch (block.type) {
            case 'text':
                return (
                    <TextBlock
                        key={block.id}
                        {...commonProps}
                        id={block.id as any}
                        content={block.content}
                        bookmark={bookmarkedBlockIds ? bookmarkedBlockIds.has(block.id.toString()) : false}
                        onUpdate={onUpdateBlock as any}
                        onDelete={onDeleteBlock as any} // Still keeping it for safety, though UI removed
                        onFocus={() => onFocusBlock(block.id)}
                        onToggleBookmark={() => onToggleBookmark?.(block.id, bookmarkedBlockIds ? bookmarkedBlockIds.has(block.id.toString()) : false)}
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
                        bookmark={bookmarkedBlockIds ? bookmarkedBlockIds.has(block.id.toString()) : false}
                        onDelete={onDeleteBlock as any}
                        onChange={onUpdateBlock as any}
                        onFocus={() => onFocusBlock(block.id)}
                        onAddBlockAfter={(content: string) => onAddBlockAfter(block.id, 'text', content)}
                        onAiReviewResult={handleAiReviewResult}
                        onToggleBookmark={() => onToggleBookmark?.(block.id, bookmarkedBlockIds ? bookmarkedBlockIds.has(block.id.toString()) : false)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="note-main-layout">
            <NoteSummary
                summary={summary}
                summaryStyle={summaryStyle}
                summaryUpdatedAt={summaryUpdatedAt}
                isLoading={isSummaryLoading ?? false}
                onGenerateSummary={onGenerateSummary ?? (() => { })}
            />
            <div className="note-body-wrapper">
                {/* External sidebar area removed */}

                <div className="note-paper">
                    <div className="note-inner-layout">
                        {/* Left Gutter with Side Nav */}
                        <aside className="note-gutter left">
                            <NoteSideNav
                                onAddBlock={onAddBlockAtEnd}
                                onInvite={() => setIsInviteModalOpen(true)}
                                onPermission={() => setIsPermissionModalOpen(true)}
                                onSummary={() => setIsSummaryModalOpen(true)}
                            />
                        </aside>

                        {/* Center Content */}
                        <div className="note-center-column">
                            <header className="note-main-header">
                                <input
                                    ref={titleInputRef}
                                    className="note-main-title-input"
                                    value={title}
                                    onChange={(e) => onUpdateTitle(e.target.value)}
                                    placeholder="제목 없음"
                                />
                            </header>
                            <div className="note-content-area">
                                <Reorder.Group
                                    values={localBlocks}
                                    onReorder={(newOrder) => {
                                        setLocalBlocks(newOrder); // Optimistic UI update
                                    }}
                                    as="div"
                                    axis="y"
                                >
                                    {localBlocks.map((block, index) => (
                                        <DraggableBlock
                                            key={block.id}
                                            block={block}
                                            onDragStart={() => {
                                                isDraggingRef.current = true;
                                            }}
                                            onDragEnd={() => {
                                                isDraggingRef.current = false;
                                                handleDragEnd(block.id);
                                            }}
                                        >
                                            {(dragControls) => renderBlock(block, index, dragControls)}
                                        </DraggableBlock>
                                    ))}
                                </Reorder.Group>
                                <div className="note-bottom-spacer" style={{ height: '50px' }} />
                            </div>
                        </div>

                        {/* Right Gutter for Symmetry */}
                        <aside className="note-gutter right" />
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            <BlockContextMenu
                position={contextMenu}
                onClose={() => setContextMenu(null)}
                onDelete={handleDeleteFromMenu}
            />

            {/* 초대 링크 모달 */}
            <InviteLinkModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                noteId={noteId}
            />
            <PermissionModal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                noteId={noteId}
            />
            {/* AI 요약 설정 모달 */}
            <SummaryConfigModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                onGenerate={onGenerateSummary ?? (() => { })}
                isLoading={isSummaryLoading ?? false}
            />
        </div>
    );
};

export default NoteMain;