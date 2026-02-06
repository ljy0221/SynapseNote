import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { socialLogin } from '../../api/authApi';
import { acceptInvitationApi } from '../../api/notes/AcceptInvitation.api';
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

    const state = searchParams.get('state');

    // 1️⃣ Browser 환경 + Electron 요청인 경우 → Deep Link로 전달
    if (!window.electronAPI && state === 'ELECTRON') {
      console.log('[OAuthCallback] Electron Login Request -> Redirecting to Deep Link');

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

        // state가 ELECTRON이면 ELECTRON, 아니면(WEB or undefined) WEB
        // 단, 이미 위에서 ELECTRON인 경우 앱으로 리다이렉트했으므로, 여기 도달했다는 것은 WEB임.
        // 하지만 Electron 앱 내부에서 실행된 경우(window.electronAPI 존재)는 ELECTRON임.
        const platform = window.electronAPI ? 'ELECTRON' : 'WEB';
        const result = await socialLogin(provider, code, platform);

        // ✅ login 하나로 책임 집중
        await login(result.accessToken);

        console.log('[OAuth] Login success');

        const redirectUrl = localStorage.getItem('loginRedirectUrl');
        const pendingInviteCode = localStorage.getItem('pendingInviteCode'); // sessionStorage -> localStorage

        if (pendingInviteCode) {
          console.log('[OAuth] Found pending invite code, redirecting to processing:', pendingInviteCode);

          try {
            await acceptInvitationApi(pendingInviteCode);
            showToast('가입 요청이 전송되었습니다. 소유자의 승인을 기다려주세요.', 'success');
            navigate('/home', { replace: true });
          } catch (invitationError: any) {
            console.error('[OAuth] Failed to process pending invitation:', invitationError);
            const msg = invitationError.response?.data?.message || '로그인은 성공했으나 가입 요청 전송에 실패했습니다.';
            showToast(msg, 'error');
            navigate('/home', { replace: true });
          } finally {
            // [Fix] 성공하든 실패하든 코드는 반드시 삭제하여 무한 반복 방지
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

        // DELETED_MEMBER 에러 코드 처리
        const errorCode = error?.response?.data?.code;
        if (errorCode === 'DELETED_MEMBER') {
          showToast('30일 이내에 재가입할 수 없습니다.', 'error');
        } else {
          showToast(
            `로그인 실패: ${error?.message ?? '알 수 없는 오류'}`,
            'error'
          );
        }
        navigate('/login', { replace: true });
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