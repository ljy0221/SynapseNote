// FE/src/components/layout/noteMain/NoteMain.tsx
import React from 'react';
import CodeBlock from '../codeBlock/CodeBlock';
import TextBlock from '../textBlock/TextBlock';
import { NoteSideNav } from './NoteSideNav';
import { InviteLinkModal } from '../../common/modal/InviteLinkModal';
import { PermissionModal } from '../../common/modal/PermissionModal'; // [New]
import { BlockData, BlockType } from '../../../pages/note/Note';
import './NoteMain.css';
interface NoteMainProps {
    title: string;
    onUpdateTitle: (newTitle: string) => void;
    blocks: BlockData[];
    onUpdateBlock: (id: number | string, content: string) => void;
    onAddBlockAfter: (afterId: number | string, type: BlockType) => void; // [추가]
    onAddBlockAtEnd: (type: BlockType) => void;
    onDeleteBlock: (id: number | string) => void;
    onFocusBlock: (id: number | string) => void;
    focusedBlockId: number | string | null; // [추가]
    onMoveBlock: (dragIndex: number, hoverIndex: number) => void;
    titleInputRef?: React.RefObject<HTMLInputElement>;
    noteId?: string; // [추가]
}
const NoteMain: React.FC<NoteMainProps> = ({
    title,
    onUpdateTitle,
    blocks,
    onUpdateBlock,
    onAddBlockAfter, // [추가]
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

    // DnD 상태 관리
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);
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
    const renderBlock = (block: BlockData, index: number) => {
        const commonProps = {
            draggable: true,
            onDragStart: (e: React.DragEvent) => onDragStart(e, index),
            onDragOver: onDragOver,
            onDrop: () => onDrop(index),
            isFocused: block.id === focusedBlockId, // [추가] 포커스 여부 전달
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
                        noteId={noteId} // [추가]
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
        <div className="note-main-layout">
            <header className="note-main-header">
                <input
                    ref={titleInputRef}
                    className="note-main-title-input"
                    value={title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    placeholder="제목 없음"
                />
            </header>
            <div className="note-body-wrapper">
                <div className="note-content-area">
                    {blocks.map((block, index) => renderBlock(block, index))}
                    <div className="note-bottom-spacer" style={{ height: '30vh' }} />
                </div>

                <div className="note-sidenav-area">
                    <NoteSideNav
                        onAddBlock={onAddBlockAtEnd}
                        onInvite={() => setIsInviteModalOpen(true)}
                        onPermission={() => setIsPermissionModalOpen(true)}
                    />
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
                noteId={noteId} // [New] Pass noteId
            />
        </div >
    );
};
export default NoteMain;