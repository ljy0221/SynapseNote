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

        // 1. 브라우저 환경인지 확인 (electronAPI가 없으면 브라우저로 간주)
        if (!window.electronAPI) {
            console.log('[OAuthCallback] Running in Browser -> Redirecting to Deep Link');

            const deepLink = `synapse://auth/${provider}/callback?code=${code}`;
            window.location.href = deepLink;

            // 브라우저 닫기 시도 (일부 브라우저는 차단할 수 있음)
            setTimeout(() => {
                window.close();
            }, 500);
            return;
        }

        // 2. Electron 환경이면 기존 로그인 로직 수행
        if (processedRef.current) return;
        processedRef.current = true;

        const handleLogin = async () => {
            try {
                console.log(`[OAuth] Processing login for ${provider} with code...`);
                const result = await socialLogin(provider, code);

                // 토큰 저장 (accessToken만 저장, refreshToken은 쿠키로 관리)
                localStorage.setItem('authToken', result.accessToken);

                console.log('[OAuth] Login success');
                navigate('/home', { replace: true });
            } catch (error: any) {
                console.error('[OAuth] Login failed:', error);
                alert(`로그인 실패: ${error.message}`);
                navigate('/login', { replace: true });
            }
        };

        handleLogin();
    }, [provider, searchParams, navigate]);

    // 브라우저용 안내 화면
    if (!window.electronAPI) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center'
            }}>
                <h2>로그인 완료</h2>
                <p>앱으로 돌아가려면 'Synapse 열기'를 클릭하세요.</p>
                <p>이 창을 닫아도 됩니다.</p>
            </div>
        );
    }

    // Electron용 로딩 화면
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
