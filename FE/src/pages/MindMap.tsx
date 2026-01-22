import React from 'react';

/**
 * 각 페이지 컴포넌트
 * App.tsx에서 이미 Header와 Sidebar를 감싸고 있으므로,
 * 여기서는 본문에 들어갈 내용만 작성하면 됩니다.
 */
const Note: React.FC = () => {
    return (
        <div className="page-content-container">
            {/* 이 안의 내용이 App.tsx의 <main> 태그 안에 렌더링됩니다. */}
            <h2>마인드맵 편집 페이지</h2>
            <p>실시간 협업 에디터 영역입니다.</p>
        </div>
    );
};

// 반드시 default export를 해주어야 App.tsx에서 자유롭게 이름을 정해 불러올 수 있습니다.
export default Note;