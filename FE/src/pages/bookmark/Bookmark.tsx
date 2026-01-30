import React from 'react';
import NoteBookmarkSection from '../../components/layout/noteBookmark/NoteBookmarkSection';
import BlockBookmarkSection from '../../components/layout/blockBookmark/BlockBookmarkSection';
import './Bookmark.css';

/**
 * 각 페이지 컴포넌트
 * App.tsx에서 이미 Header와 Sidebar를 감싸고 있으므로,
 * 여기서는 본문에 들어갈 내용만 작성하면 됩니다.
 */
const Bookmark: React.FC = () => {
    return (
        <div className="bookmark-page">
            {/* Page Header */}
            <h2 className="bookmark-page-title">BookMark</h2>

            {/* Note Section */}
            <NoteBookmarkSection />

            {/* Block Section */}
            <BlockBookmarkSection />
        </div>
    );
};

// 반드시 default export를 해주어야 App.tsx에서 자유롭게 이름을 정해 불러올 수 있습니다.
export default Bookmark;