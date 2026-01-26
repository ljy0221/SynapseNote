// src/pages/Note.tsx
import React, { useState } from 'react';
import NoteButton from '../components/common/noteButton/NoteButton';
import NoteMain from '../components/layout/noteMain/NoteMain';
import { NoteToolBar } from '../components/layout/noteToolbar/NoteToolbar'; // 툴바 임포트
import './Note.css';

const Note: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="page-content-container">
            {!isEditing ? (
                <>
                    <h2>노트 편집 페이지</h2>
                    <p>실시간 협업 에디터 영역입니다.</p>
                    <div className="create-note-section">
                        <NoteButton onClick={() => setIsEditing(true)} />
                        <span className="create-note-label">새 노트 작성하기</span>
                    </div>
                </>
            ) : (
                /* ✅ 편집 모드일 때만 Main과 Toolbar를 나란히 배치 */
                <div className="editing-layout-wrapper">
                    <NoteMain />
                    <NoteToolBar isOpen={true} /> 
                </div>
            )}
        </div>
    );
};

export default Note;