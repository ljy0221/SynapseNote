import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import { NoteSideNav } from './NoteSideNav';
import { InviteLinkModal } from '../../common/modal/InviteLinkModal';
import { PermissionModal } from '../../common/modal/PermissionModal';
import { SummaryConfigModal } from '../../common/modal/SummaryConfigModal';
import { NoteSummary } from '../../common/noteSummary/NoteSummary';
import { BlockData, BlockType } from '../../../pages/note/Note';
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
    onGenerateSummary
}) => {
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = React.useState(false);
    // [New] AI 요약 모달 상태
    const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);

    // [New] Context Menu State
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; blockId: string | number } | null>(null);

    // DnD 상태 관리
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);

    // 디버깅: 실제 렌더링되는 블록 데이터 확인
    console.log("[NoteMain] Current blocks for rendering:", blocks);

    const onDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        setDragIndex(index);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (dropIndex: number) => {
        if (dragIndex === null || dragIndex === dropIndex) return;
        onMoveBlock(dragIndex, dropIndex);
        setDragIndex(null);
    };

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

    const renderBlock = (block: BlockData, index: number) => {
        const commonProps = {
            draggable: true,
            onDragStart: (e: React.DragEvent) => onDragStart(e, index),
            onDragOver: onDragOver,
            onDrop: () => onDrop(index),
            isFocused: block.id === focusedBlockId, // [추가] 포커스 여부 전달
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
                        onUpdate={onUpdateBlock as any}
                        onDelete={onDeleteBlock as any} // Still keeping it for safety, though UI removed
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
                        onAddBlockAfter={(content: string) => onAddBlockAfter(block.id, 'text', content)}
                        onAiReviewResult={handleAiReviewResult}
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
                <div className="note-sidenav-area">
                    <NoteSideNav
                        onAddBlock={onAddBlockAtEnd}
                        onInvite={() => setIsInviteModalOpen(true)}
                        onPermission={() => setIsPermissionModalOpen(true)}
                        onSummary={() => setIsSummaryModalOpen(true)}
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
                    <div className="note-content-area">
                        {blocks.map((block, index) => renderBlock(block, index))}
                        <div className="note-bottom-spacer" style={{ height: '30vh' }} />
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