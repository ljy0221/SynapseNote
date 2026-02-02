import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { socialLogin } from '../../api/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

const OAuthCallback: React.FC = () => {
    const { provider } = useParams<{ provider: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const processedRef = useRef(false);
    const login = useAuthStore((state) => state.login);
    const showToast = useToastStore((state) => state.showToast);

    useEffect(() => {
        const code = searchParams.get('code');

        if (!provider || !code) {
            showToast('잘못된 접근입니다.', 'error');
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
            }, 3000);
            return;
        }

        // 2. Electron 환경이면 기존 로그인 로직 수행
        if (processedRef.current) return;
        processedRef.current = true;

        const handleLogin = async () => {
            try {
                console.log(`[OAuth] Processing login for ${provider} with code...`);
                const result = await socialLogin(provider, code);

                // Store를 통해 로그인 처리 (토큰 저장 및 유저 정보 갱신)
                await login(result.accessToken);

                console.log('[OAuth] Login success');
                navigate('/home', { replace: true });
            } catch (error: any) {
                console.error('[OAuth] Login failed:', error);

                showToast(`로그인 실패: ${error.message}`, 'error');
                navigate('/login', { replace: true });
            }
        };

        handleLogin();
    }, [provider, searchParams, navigate, login, showToast]);

    // 브라우저용 안내 화면
    if (!window.electronAPI) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center'
            }}>
                <h2>로그인 완료</h2>
                <p>브라우저 팝업이 뜨면 <b>'Synapse 열기'</b>를 클릭해주세요.</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                    * '항상 허용'을 체크하시면 다음부터는 자동으로 로그인됩니다.
                </p>
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
