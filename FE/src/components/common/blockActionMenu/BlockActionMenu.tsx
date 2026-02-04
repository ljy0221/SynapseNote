import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { GripVertical, Trash2 } from 'lucide-react';
import './BlockActionMenu.css';

interface BlockActionMenuProps {
    position: { x: number; y: number } | null;
    onClose: () => void;
    onDelete: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

const BlockActionMenu: React.FC<BlockActionMenuProps> = ({
    position,
    onClose,
    onDelete,
    draggable,
    onDragStart
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', onClose, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', onClose, true);
        };
    }, [position, onClose]);

    return (
        <div className="block-action-menu-container">
            <div
                className="block-drag-handle"
                draggable={draggable}
                onDragStart={onDragStart}
                title="드래그하여 이동 (우클릭: 메뉴)"
                style={{
                    cursor: 'grab',
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    color: 'var(--font-color-sub, #666)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <GripVertical size={20} />
            </div>

            {position && ReactDOM.createPortal(
                <div
                    className="block-context-menu"
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: position.y,
                        left: position.x,
                        zIndex: 9999,
                        background: 'white',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        border: '1px solid #eee',
                        minWidth: '100px',
                        padding: '4px 0'
                    }}
                >
                    <button
                        className="menu-item delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            onClose();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#ff4d4f',
                            fontSize: '14px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff1f0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Trash2 size={16} />
                        <span>삭제</span>
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BlockActionMenu;
