import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { socialLogin } from '../../api/authApi';
import { acceptInvitationApi } from '../../api/notes/AcceptInvitation.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

// Module-level set to track processed codes (prevents double-execution in StrictMode)
const processedCodes = new Set<string>();

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();


  const login = useAuthStore((state) => state.login);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!provider || !code) {
      showToast('잘못된 접근입니다.', 'error');
      navigate('/login', { replace: true });
      return;
    }

    const state = searchParams.get('state');

    // state가 'ELECTRON'이면 ELECTRON, 그 외엔 WEB으로 간주
    let statePlatform = 'WEB';
    if (state === 'ELECTRON') {
      statePlatform = 'ELECTRON';
    }

    // Browser 환경 + Electron(상태) 요청인 경우 → Deep Link로 전달
    if (!window.electronAPI && statePlatform === 'ELECTRON') {

      const deepLink = `synapse://auth/${provider}/callback?code=${code}`;
      window.location.href = deepLink;

      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }

    // Electron 환경 → 실제 로그인 처리
    if (processedCodes.has(code)) {
      return;
    }
    processedCodes.add(code);

    const handleLogin = async () => {
      try {
        const isElectron = !!window.electronAPI;
        const isDev = import.meta.env.DEV;
        const platform = (isElectron && isDev) ? 'ELECTRON' : 'WEB';

        const result = await socialLogin(provider, code, platform);

        await login(result.accessToken);

        const localRedirectUrl = localStorage.getItem('loginRedirectUrl');
        const redirectUrl = localRedirectUrl;


        const pendingInviteCode = localStorage.getItem('pendingInviteCode');

        if (pendingInviteCode) {

          try {
            await acceptInvitationApi(pendingInviteCode);
            showToast('가입 요청이 전송되었습니다. 소유자의 승인을 기다려주세요.', 'success');
            if (redirectUrl) {
              navigate(redirectUrl, { replace: true });
            } else {
              navigate('/home', { replace: true });
            }
          } catch (invitationError: any) {
            const msg = invitationError.response?.data?.message || '로그인은 성공했으나 가입 요청 전송에 실패했습니다.';
            showToast(msg, 'error');
            navigate('/home', { replace: true });
          } finally {
            localStorage.removeItem('pendingInviteCode');
          }
        } else if (redirectUrl) {
          localStorage.removeItem('loginRedirectUrl');
          navigate(redirectUrl, { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      } catch (error: any) {
        console.error('[OAuth] Login failed:', error);

        // 특정 에러 코드 처리
        const errorData = error?.response?.data?.error;
        const errorCode = errorData?.code;

        if (errorCode === 'DELETED_MEMBER' || errorCode === 'MEMBER_ALREADY_EXISTS_ANOTHER_PROVIDER') {
          navigate(`/login?errorCode=${errorCode}`, { replace: true });
        } else {
          showToast(
            `로그인 실패: ${error?.message ?? '알 수 없는 오류'}`,
            'error'
          );
          navigate('/login', { replace: true });
        }
      }
    };

    handleLogin();
  }, [provider, searchParams, navigate, login, showToast]);

  // 브라우저용 안내 화면 (Electron Callback인 경우)
  const state = searchParams.get('state');

  if (!window.electronAPI && state === 'ELECTRON') {
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
        <p>앱으로 돌아갑니다.</p>
        <button
          onClick={() => {
            const code = searchParams.get('code');
            window.location.href = `synapse://auth/${provider}/callback?code=${code}`;
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: 'var(--color-point)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          앱 열기
        </button>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
          * '항상 허용'을 체크하시면 다음부터는 자동으로 로그인됩니다.
        </p>
      </div>
    );
  }

  // Web App 로그인 처리 중 or Electron App 내부 로딩
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