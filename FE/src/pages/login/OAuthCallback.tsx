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
      navigate('/login', { replace: true });
      return;
    }

    // 1️⃣ Browser 환경 → Deep Link로 Electron 전달
    if (!window.electronAPI) {
      console.log('[OAuthCallback] Running in Browser -> Redirecting to Deep Link');

      const deepLink = `synapse://auth/${provider}/callback?code=${code}`;
      window.location.href = deepLink;

      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }

    // 2️⃣ Electron 환경 → 실제 로그인 처리
    if (processedRef.current) return;
    processedRef.current = true;

    const handleLogin = async () => {
      try {
        console.log(`[OAuth] Processing login for ${provider} with code...`);

        const platform = window.electronAPI ? 'ELECTRON' : 'WEB';
        const result = await socialLogin(provider, code, platform);

        // ✅ login 하나로 책임 집중
        await login(result.accessToken);

        console.log('[OAuth] Login success');

        const redirectUrl = localStorage.getItem('loginRedirectUrl');
        if (redirectUrl) {
          localStorage.removeItem('loginRedirectUrl');
          navigate(redirectUrl, { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      } catch (error: any) {
        console.error('[OAuth] Login failed:', error);

        showToast(
          `로그인 실패: ${error?.message ?? '알 수 없는 오류'}`,
          'error'
        );
        navigate('/login', { replace: true });
      }
    };

    handleLogin();
  }, [provider, searchParams, navigate, login, showToast]);

  // 브라우저용 안내 화면
  if (!window.electronAPI) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
        }}
      >
        <h2>로그인 완료</h2>
        <p>
          브라우저 팝업이 뜨면 <b>'Synapse 열기'</b>를 클릭해주세요.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
          * '항상 허용'을 체크하시면 다음부터는 자동으로 로그인됩니다.
        </p>
      </div>
    );
  }

  // Electron 로딩 화면
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--font-color)',
      }}
    >
      <h2>로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
};

export default OAuthCallback;