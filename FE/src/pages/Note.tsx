// src/pages/Note.tsx
import React, { useState } from 'react';
import NoteButton from '../components/common/noteButton/NoteButton';
import NoteMain from '../components/layout/noteMain/NoteMain'; // 레이아웃 컴포넌트 추가
import './Note.css';

const Note: React.FC = () => {
    // 1. 편집 모드 상태 관리 (초기값 false)
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="page-content-container">
            {!isEditing ? (
                // [화면 A] 초기 가이드 화면
                <>
                    <h2>노트 편집 페이지</h2>
                    <p>실시간 협업 에디터 영역입니다.</p>
                    <div className="create-note-section">
                        {/* 클릭 시 상태를 true로 변경 */}
                        <NoteButton onClick={() => setIsEditing(true)} />
                        <span className="create-note-label">새 노트 작성하기</span>
                    </div>
                </>
            ) : (
                // [화면 B] 목업 이미지의 메인 에디터 영역
                <NoteMain />
            )}
        </div>
    );
};

export default Note;