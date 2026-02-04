import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import './BlockContextMenu.css';

interface BlockContextMenuProps {
    position: { x: number; y: number } | null;
    onClose: () => void;
    onDelete: () => void;
}

const BlockContextMenu: React.FC<BlockContextMenuProps> = ({
    position,
    onClose,
    onDelete,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', onClose, { capture: true }); // Close on scroll
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', onClose, { capture: true });
        };
    }, [position, onClose]);

    if (!position) return null;

    return (
        <div
            ref={menuRef}
            className="block-context-menu"
            style={{
                top: position.y,
                left: position.x,
            }}
        >
            <div className="menu-item delete" onClick={onDelete}>
                <Trash2 size={16} />
                <span>삭제</span>
            </div>
        </div>
    );
};

export default BlockContextMenu;
