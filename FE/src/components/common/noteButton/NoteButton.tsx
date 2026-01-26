// src/components/common/noteButton/NoteButton.tsx
import React from 'react';
import { Plus } from 'react-feather';
import './NoteButton.css';

interface NoteButtonProps {
    className?: string;
    onClick?: () => void; // 1. 부모로부터 클릭 이벤트를 받을 수 있도록 추가
}

const NoteButton: React.FC<NoteButtonProps> = ({ className = '', onClick }) => {
    // 내부 handleCreateNote 대신 props로 받은 onClick을 사용합니다.
    return (
        <button 
            className={`note-button active ${className}`} 
            onClick={onClick} // 2. 여기서 부모의 setIsEditing(true)이 실행됩니다.
            title="새 노트 작성"
        >
            <div className="icon-container">
                <Plus size={24} />
            </div>
        </button>
    );
};

export default NoteButton;