// FE/src/components/layout/blockTypeMenu/BlockTypeMenu.tsx
import React from 'react';
import { BlockType } from '../../../pages/note/Note';
import './BlockTypeMenu.css';
interface BlockTypeMenuProps {
    onSelect: (type: BlockType) => void;
    onClose: () => void;
}
const BlockTypeMenu: React.FC<BlockTypeMenuProps> = ({ onSelect, onClose }) => {
    // 블록 타입 옵션 (이원화)
    const blockTypes = [
        { type: 'text' as BlockType, label: '일반 블록', icon: 'T', description: '텍스트, 제목, 이미지 등' },
        { type: 'code' as BlockType, label: '코드 블록', icon: '</>', description: '코드 작성 및 실행' },
    ];
    return (
        <div className="block-type-menu">
            <div className="menu-backdrop" onClick={onClose} />
            <div className="menu-content">
                {blockTypes.map((item) => (
                    <button
                        key={item.type}
                        className="menu-item"
                        onClick={() => onSelect(item.type)}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <div className="menu-text">
                            <span className="menu-label">{item.label}</span>
                            <span className="menu-description">{item.description}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
export default BlockTypeMenu;