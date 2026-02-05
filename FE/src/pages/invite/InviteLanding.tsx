import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const InviteLanding: React.FC = () => {
    const { code } = useParams<{ code: string }>();

    useEffect(() => {
        if (!code) return;

        // 웹 브라우저인 경우에만 앱 실행 시도
        if (!window.electronAPI) {
            const deepLink = `synapse://invite/${code}`;
            console.log('[InviteLanding] Attempting to open app with:', deepLink);
            window.location.href = deepLink;
        }
    }, [code]);

    const handleOpenApp = () => {
        if (code) {
            window.location.href = `synapse://invite/${code}`;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--font-color)',
            textAlign: 'center',
            gap: '20px'
        }}>
            <h1 style={{ fontSize: '2rem' }}>워크스페이스 초대</h1>
            <p>초대 링크를 확인했습니다.</p>

            <button
                onClick={handleOpenApp}
                style={{
                    padding: '12px 24px',
                    fontSize: '1.2rem',
                    backgroundColor: 'var(--color-main)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                앱 열기
            </button>

            <button
                onClick={() => window.location.href = `/notes/invitation/${code}`}
                style={{
                    padding: '12px 24px',
                    fontSize: '1.0rem',
                    backgroundColor: 'transparent',
                    color: 'var(--font-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: 0.8
                }}
            >
                브라우저에서 계속하기
            </button>

            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                앱이 설치되어 있지 않다면 설치해주세요.
            </p>
        </div>
    );
};

export default InviteLanding;
