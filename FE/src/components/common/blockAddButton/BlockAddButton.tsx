// src/components/common/blockAddButton/BlockAddButton.tsx
import React from 'react';
import './BlockAddButton.css';

interface BlockAddButtonProps {
    className?: string;
    onClick?: () => void;
}

const BlockAddButton: React.FC<BlockAddButtonProps> = ({ className = '', onClick }) => {
    return (
        <button 
            className={`block-add-button ${className}`}
            onClick={onClick}
            title="새 블록 추가"
        >
            <span className="plus-icon">+</span>
            <span>Add Block</span>
        </button>
    );
};

export default BlockAddButton;