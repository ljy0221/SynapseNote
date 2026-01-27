// src/components/common/blockDeleteButton/BlockDeleteButton.tsx
import React from 'react';
import './BlockDeleteButton.css';

interface Props { onDelete: () => void; }

const BlockDeleteButton: React.FC<Props> = ({ onDelete }) => (
    <button className="block-delete-btn" onClick={onDelete} title="블록 삭제">
        <span>🗑️</span>
    </button>
);
export default BlockDeleteButton;