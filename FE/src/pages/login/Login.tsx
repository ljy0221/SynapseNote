// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// 1. SocialLoginButton 임포트 추가
import { SocialLoginButton } from "../../components/common/socialLoginButton/SocialLoginButton";
import { SynapseLogo } from "../../components/common/logo/SynapseLogo";
import HomeButton from "../../components/common/homeButton/HomeButton.tsx";

const Login: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            setErrorMessage(decodeURIComponent(error));
            // URL에서 error 파라미터 제거
            searchParams.delete('error');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // 에러 메시지 자동 제거
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 3000); // 3초로 변경

            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative' }}>

            {/* [좌측] 브랜드 비주얼 영역 */}
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

            {/* [우측] 로그인 액션 영역 */}
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
                                const clientId = isElectron
                                    ? import.meta.env.VITE_GITHUB_CLIENT_ID
                                    : import.meta.env.VITE_GITHUB_WEB_CLIENT_ID;

                                let redirectUri;
                                if (isElectron) {
                                    redirectUri = isDev
                                        ? import.meta.env.VITE_GITHUB_REDIRECT_URI
                                        : import.meta.env.VITE_GITHUB_PRODUCTION_REDIRECT_URI;
                                } else {
                                    redirectUri = import.meta.env.VITE_GITHUB_WEB_REDIRECT_URI;
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
                                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Google shares Client ID

                                let redirectUri;
                                if (isElectron) {
                                    redirectUri = isDev
                                        ? import.meta.env.VITE_GOOGLE_REDIRECT_URI
                                        : import.meta.env.VITE_GOOGLE_PRODUCTION_REDIRECT_URI;
                                } else {
                                    redirectUri = import.meta.env.VITE_GOOGLE_WEB_REDIRECT_URI;
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

                    {/* 에러 메시지 표시 영역 (고정 높이) */}
                    <div style={{
                        marginTop: '24px',
                        height: '60px', // 정확한 고정 높이로 레이아웃 완전 고정
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