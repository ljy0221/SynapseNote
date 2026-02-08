// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SocialLoginButton } from "../../components/common/socialLoginButton/SocialLoginButton";
import { SynapseLogo } from "../../components/common/logo/SynapseLogo";
import { env } from '../../config/env';


const Login: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 에러 코드별 메시지 사전 (프론트엔드에서 관리)
    const ERROR_MESSAGES: Record<string, string> = {
        'DELETED_MEMBER': '탈퇴한 회원은 30일 동안 재가입할 수 없습니다.',
        'MEMBER_ALREADY_EXISTS_ANOTHER_PROVIDER': '이 이메일은 다른 소셜 로그인으로 이미 가입되어 있습니다.',
    };

    useEffect(() => {
        const errorCode = searchParams.get('errorCode');
        if (errorCode) {
            // 에러 코드에 해당하는 메시지 표시
            const message = ERROR_MESSAGES[errorCode] || '로그인에 실패했습니다.';
            setErrorMessage(message);
            // URL에서 errorCode 파라미터 제거
            searchParams.delete('errorCode');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // 에러 메시지 자동 제거
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative' }}>

            {/* 브랜드 비주얼 영역 */}
            <div style={{
                flex: 1.2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 10%',
                backgroundColor: 'var(--color-sub)',
                position: 'relative'
            }}>
                <div>
                    <div style={{ color: 'var(--color-point)', marginBottom: '24px' }}>
                        <SynapseLogo width={80} height={80} />
                    </div>
                    <h1 style={{ fontSize: '3.5rem', margin: '24px 0', fontWeight: '800' }}>Synapse</h1>
                    <p style={{ fontSize: '1.2rem', opacity: 0.7, lineHeight: '1.6' }}>
                        Connect your thoughts,<br />
                        Build your knowledge.
                    </p>
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.9rem',
                    opacity: 0.4,
                    letterSpacing: '1px',
                    fontWeight: '500',
                    color: 'var(--font-color)',
                    whiteSpace: 'nowrap'
                }}>
                    Team : 대머리쫀득쿠키
                </div>
            </div>
            {/* 로그인 액션 영역 */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-main)'
            }}>
                <div style={{ width: '100%', maxWidth: '360px', padding: '20px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Get Started</h2>
                    <p style={{ marginBottom: '48px', opacity: 0.5 }}>소셜 계정으로 간편하게 시작하세요.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <SocialLoginButton
                            provider="github"
                            onClick={() => {
                                const isElectron = !!window.electronAPI;
                                const isDev = import.meta.env.DEV;
                                // Electron always uses WEB_CLIENT_ID
                                const clientId = isElectron
                                    ? env.VITE_GITHUB_WEB_CLIENT_ID
                                    : env.VITE_GITHUB_WEB_CLIENT_ID;

                                let redirectUri;
                                if (isElectron) {
                                    redirectUri = isDev
                                        ? env.VITE_GITHUB_REDIRECT_URI
                                        : env.VITE_GITHUB_PRODUCTION_REDIRECT_URI;
                                } else {
                                    redirectUri = env.VITE_GITHUB_WEB_REDIRECT_URI;
                                }

                                const state = isElectron ? 'ELECTRON' : 'WEB';

                                const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`;
                                if (isElectron) {
                                    window.electronAPI.openExternal(authUrl);
                                } else {
                                    window.location.href = authUrl;
                                }
                            }}
                        />
                        <SocialLoginButton
                            provider="google"
                            onClick={() => {
                                const isElectron = !!window.electronAPI;
                                const isDev = import.meta.env.DEV;
                                const clientId = env.VITE_GOOGLE_CLIENT_ID;

                                let redirectUri;
                                if (isElectron) {
                                    redirectUri = isDev
                                        ? env.VITE_GOOGLE_REDIRECT_URI
                                        : env.VITE_GOOGLE_PRODUCTION_REDIRECT_URI;
                                } else {
                                    redirectUri = env.VITE_GOOGLE_WEB_REDIRECT_URI;
                                }

                                const state = isElectron ? 'ELECTRON' : 'WEB';

                                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&state=${state}`;
                                if (isElectron) {
                                    window.electronAPI.openExternal(authUrl);
                                } else {
                                    window.location.href = authUrl;
                                }
                            }}
                        />
                    </div>

                    {/* 에러 메시지 표시 영역 */}
                    <div style={{
                        marginTop: '24px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'flex-start',
                    }}>
                        {errorMessage && (
                            <div style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'rgba(255, 77, 77, 0.1)',
                                border: '1px solid #ff4d4d',
                                borderRadius: '8px',
                                color: '#ff4d4d',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                lineHeight: '1.5',
                                boxSizing: 'border-box',
                            }}>
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
};

export default Login;