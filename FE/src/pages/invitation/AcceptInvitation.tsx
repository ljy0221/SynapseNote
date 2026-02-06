import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitationApi } from '../../api/notes/AcceptInvitation.api';
import { useAuthStore } from '../../store/useAuthStore';
import './AcceptInvitation.css';

const AcceptInvitation: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    // [Refactor] 상태값 명시적 분리 (duplicate 추가)
    const [status, setStatus] = useState<'loading' | 'success' | 'duplicate' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('유효하지 않은 초대 링크입니다.');
            return;
        }

        // Wait for auth initialization
        if (isLoading) return;

        if (!isAuthenticated) {
            localStorage.setItem('loginRedirectUrl', `/notes/invitation/${token}`);
            navigate('/login');
            return;
        }

        const processInvitation = async () => {
            try {
                await acceptInvitationApi(token);
                setStatus('success');

                // [Modified] 환경에 따른 분기 처리
                if (window.electronAPI) {
                    setTimeout(() => {
                        navigate('/home');
                    }, 2000);
                } else {
                    // 웹에서는 이동하지 않고 성공 UI 유지 (앱 열기 버튼 등 표시)
                    // useEffect의 navigate('/home') 제거됨
                }
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || '초대 수락 중 오류가 발생했습니다.';

                // [Refactor] 409 에러 시 명시적 상태 변경
                if (err.response?.status === 409 || errorMsg.includes('이미')) {
                    setStatus('duplicate');
                    setErrorMessage('이미 가입 요청이 전송된 상태입니다. 승인을 기다려주세요.');
                } else {
                    setStatus('error');
                    setErrorMessage(errorMsg);
                }
            }
        };

        processInvitation();
    }, [token, navigate, isAuthenticated, isLoading]);

    return (
        <div className="accept-invitation-container">
            <div className="accept-card" style={{ padding: '40px', textAlign: 'center' }}>
                {status === 'loading' && (
                    <>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>초대를 확인하고 있습니다...</p>
                    </>
                )}
                {/* 성공 상태 */}
                {status === 'success' && (
                    <>
                        <div className="success-icon" style={{ fontSize: '4rem', color: '#4CAF50', marginBottom: '20px' }}>✓</div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>가입 요청 전송 완료</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>관리자가 승인하면 알림을 받게 됩니다.</p>

                        {/* [Modified] Web 환경일 경우 앱 열기 안내 */}
                        {!window.electronAPI ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                <p className="sub-text" style={{ fontSize: '1rem', color: '#333', fontWeight: 'bold' }}>
                                    이제 데스크톱 앱에서 확인해주세요.
                                </p>
                                <button
                                    onClick={() => window.location.href = 'synapse://home'}
                                    style={{
                                        padding: '12px 24px',
                                        fontSize: '1.1rem',
                                        backgroundColor: 'var(--color-main)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    앱 열기
                                </button>
                            </div>
                        ) : (
                            <p className="sub-text" style={{ fontSize: '0.9rem', color: '#999' }}>잠시 후 홈으로 이동합니다.</p>
                        )}
                    </>
                )}
                {/* [Refactor] 중복 상태 별도 렌더링 */}
                {status === 'duplicate' && (
                    <>
                        <div className="duplicate-icon" style={{ fontSize: '4rem', color: '#FF9800', marginBottom: '20px' }}>!</div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>이미 요청되었습니다</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>{errorMessage}</p>
                        <button
                            onClick={() => navigate('/home')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'var(--color-main)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            홈으로 가기
                        </button>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="error-icon" style={{ fontSize: '4rem', color: '#f44336', marginBottom: '20px' }}>!</div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>오류 발생</h2>
                        <p className="error-text" style={{ color: '#666', marginBottom: '30px' }}>{errorMessage}</p>
                        <button
                            onClick={() => navigate('/home')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'var(--color-main)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            홈으로 가기
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvitation;
