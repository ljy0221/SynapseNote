//로그인 페이지

import React from 'react';
import HomeButton from '../components/common/homeButton/HomeButton';
/**
 * 각 페이지 컴포넌트
 * App.tsx에서 이미 Header와 Sidebar를 감싸고 있으므로,
 * 여기서는 본문에 들어갈 내용만 작성하면 됩니다.
 */
const Login: React.FC = () => {
    return (
        <div className="page-content-container">
            {/* 이 안의 내용이 App.tsx의 <main> 태그 안에 렌더링됩니다. */}
            <h2>로그인</h2>
            <p>실시간 협업 에디터 영역입니다.</p>
            {/* HomeButton 컴포넌트를 사용하여 홈으로 이동하는 버튼을 추가 */}
            <div style={{ marginTop: '24px' }}>
                <HomeButton />
            </div>
        </div>
    );
};

// 반드시 default export를 해주어야 App.tsx에서 자유롭게 이름을 정해 불러올 수 있습니다.
export default Login;