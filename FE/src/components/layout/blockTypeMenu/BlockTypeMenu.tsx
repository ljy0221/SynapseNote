import React from 'react';
import { BlockType } from '../../../pages/note/Note';
import './BlockTypeMenu.css';

interface BlockTypeMenuProps {
    onSelect: (type: BlockType) => void;
    onClose: () => void;
}

const BlockTypeMenu: React.FC<BlockTypeMenuProps> = ({ onSelect, onClose }) => {
    // 헤더만 우선 구현
    const menuItems = [
        { type: 'h1' as BlockType, label: '제목 1', icon: 'H1', description: '큰 제목' },
        { type: 'h2' as BlockType, label: '제목 2', icon: 'H2', description: '중간 제목' },
        { type: 'h3' as BlockType, label: '제목 3', icon: 'H3', description: '작은 제목' },
        { type: 'text' as BlockType, label: '텍스트', icon: 'T', description: '일반 텍스트' },
    ];

    return (
        <>
            <div className="block-menu-overlay" onClick={onClose} />
            <div className="block-type-menu">
                <div className="menu-header">블록 타입 선택</div>
                {menuItems.map((item) => (
                    <button
                        key={item.type}
                        className="menu-item"
                        onClick={() => onSelect(item.type)}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <div className="menu-content">
                            <div className="menu-label">{item.label}</div>
                            <div className="menu-description">{item.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </>
    );
};

export default BlockTypeMenu;