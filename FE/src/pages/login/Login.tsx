// src/pages/Login.tsx
import React from 'react';
// 1. SocialLoginButton 임포트 추가
import { SocialLoginButton } from "../../components/common/socialLoginButton/SocialLoginButton";
import HomeButton from "../../components/common/homeButton/HomeButton.tsx";
const Login: React.FC = () => {
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
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-point)', borderRadius: '20px' }} />
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
                                console.log("GitHub OAuth 시작");
                            }}
                        />
                        <SocialLoginButton
                            provider="google"
                            onClick={() => {
                                console.log("Google OAuth 시작");
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* [임시] 개발 전용 홈 이동 버튼 */}
            <div style={{ position: 'fixed', right: '30px', bottom: '30px', zIndex: 9999 }}>
                <HomeButton />
            </div>

        </div>
    );
};

export default Login;