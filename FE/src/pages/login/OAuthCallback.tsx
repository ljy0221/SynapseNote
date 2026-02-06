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
  // processedRef is insufficient for StrictMode unmount/remount, using module-level Set instead
  // const processedRef = useRef(false);

  const login = useAuthStore((state) => state.login);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!provider || !code) {
      showToast('잘못된 접근입니다.', 'error');
      navigate('/login', { replace: true });
      return;
    }

    // 4. State Parsing (Platform & Redirect URL)
    let statePlatform = 'WEB';
    let stateRedirectUrl: string | null = null;
    try {
      if (state) {
        if (state === 'ELECTRON' || state === 'WEB') {
          statePlatform = state;
        } else {
          const parsed = JSON.parse(decodeURIComponent(state));
          statePlatform = parsed.platform || 'WEB';
          stateRedirectUrl = parsed.redirectUrl || null;
          console.log('[OAuth] Parsed state:', parsed);
        }
      }
    } catch (e) {
      console.warn('[OAuth] Failed to parse state, defaulting to WEB:', e);
      // Fallback for simple string state
      if (state === 'ELECTRON') statePlatform = 'ELECTRON';
    }

    // 1️⃣ Browser 환경 + Electron(상태) 요청인 경우 → Deep Link로 전달
    if (!window.electronAPI && statePlatform === 'ELECTRON') {
      console.log('[OAuthCallback] Electron Login Request -> Redirecting to Deep Link');

      const deepLink = `synapse://auth/${provider}/callback?code=${code}`;
      window.location.href = deepLink;

      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }

    // 2️⃣ Electron 환경 → 실제 로그인 처리
    if (processedCodes.has(code)) {
      console.log('[OAuth] Code already processed, skipping:', code);
      return;
    }
    processedCodes.add(code);

    const handleLogin = async () => {
      try {
        console.log(`[OAuth] Processing login for ${provider} with code...`);

        // [Modified] Use platform from state if available, otherwise infer
        // This ensures mismatch between "Start on Electron -> Callback on Web" is handled if we wanted to support it,
        // but mostly it ensures 'state' passed from Login matches here.
        // However, backend redirect_uri matching depends on what we sent in 'state' NO, it depends on 'redirect_uri' param sent to provider.
        // Wait, socialLogin API sends 'platform' to backend, and backend selects redirect_uri to verify against.
        // So we MUST send the SAME platform as we used to generate the link.

        console.log('[OAuth] Using Platform:', statePlatform);

        const result = await socialLogin(provider, code, statePlatform);

        // ✅ login 하나로 책임 집중
        await login(result.accessToken);

        console.log('[OAuth] Login success');

        // [Modified] Priority: State > LocalStorage
        const localRedirectUrl = localStorage.getItem('loginRedirectUrl');
        const redirectUrl = stateRedirectUrl || localRedirectUrl;

        console.log('[OAuth] Redirect Target:', redirectUrl);

        const pendingInviteCode = localStorage.getItem('pendingInviteCode'); // sessionStorage -> localStorage

        if (pendingInviteCode) {
          console.log('[OAuth] Found pending invite code, redirecting to processing:', pendingInviteCode);

          try {
            await acceptInvitationApi(pendingInviteCode);
            showToast('가입 요청이 전송되었습니다. 소유자의 승인을 기다려주세요.', 'success');
            // If there is a redirectUrl (e.g. invitation page), go there, otherwise home
            // But usually after accepting invite, we stay on invitation page or go home.
            // Let's go to redirectUrl if it's the invitation page (which it usually is).
            if (redirectUrl) {
              navigate(redirectUrl, { replace: true });
            } else {
              navigate('/home', { replace: true });
            }
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
          localStorage.removeItem('loginRedirectUrl'); // Clean up local storage backup
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
          // 에러 코드만 전달 (보안상 메시지는 프론트에서 관리)
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
  // Re-parse state for render logic (duplicated but safe)
  let renderStatePlatform = 'WEB';
  try {
    if (state && (state === 'ELECTRON' || state === 'WEB')) {
      renderStatePlatform = state;
    } else if (state) {
      renderStatePlatform = JSON.parse(decodeURIComponent(state)).platform || 'WEB';
    }
  } catch { }

  if (!window.electronAPI && renderStatePlatform === 'ELECTRON') {
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