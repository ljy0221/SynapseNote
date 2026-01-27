import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { socialLogin } from '../../api/authApi';

const OAuthCallback: React.FC = () => {
    const { provider } = useParams<{ provider: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const processedRef = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');

        if (!provider || !code) {
            alert('잘못된 접근입니다.');
            navigate('/login');
            return;
        }

        if (processedRef.current) return;
        processedRef.current = true;

        const handleLogin = async () => {
            try {
                console.log(`[OAuth] Processing login for ${provider} with code...`);
                const result = await socialLogin(provider, code);

                // 토큰 저장
                localStorage.setItem('authToken', result.accessToken);
                if (result.refreshToken) {
                    localStorage.setItem('refreshToken', result.refreshToken);
                }

                console.log('[OAuth] Login success');
                navigate('/home');
            } catch (error: any) {
                console.error('[OAuth] Login failed:', error);
                alert(`로그인 실패: ${error.message}`);
                navigate('/login');
            }
        };

        handleLogin();
    }, [provider, searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--font-color)'
        }}>
            <h2>로그인 처리 중...</h2>
            <p>잠시만 기다려주세요.</p>
        </div>
    );
};

export default OAuthCallback;
