import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitationApi } from '../../api/notes/AcceptInvitation.api';
import { useAuthStore } from '../../store/useAuthStore';
import './AcceptInvitation.css';

const AcceptInvitation: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    const { isAuthenticated, isLoading } = useAuthStore(); // Add auth check

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('유효하지 않은 초대 링크입니다.');
            return;
        }

        // Wait for auth initialization
        if (isLoading) return;

        if (!isAuthenticated) {
            // Save current URL to redirect back after login
            localStorage.setItem('loginRedirectUrl', `/invitation/${token}`);
            // Force navigate to login
            navigate('/login');
            return;
        }

        const processInvitation = async () => {
            // ... existing logic ...
            try {
                await acceptInvitationApi(token);
                // ...
                setStatus('success');
                setTimeout(() => {
                    navigate('/home');
                }, 2000);
            } catch (err: any) {
                // ...
                const errorMsg = err.response?.data?.message || '초대 수락 중 오류가 발생했습니다.';
                // [Fix] 이미 요청된 경우 처리
                if (errorMsg.includes('이미') || err.response?.status === 409) {
                    setStatus('success'); // 성공 화면과 유사하게 처리하되 메시지 변경
                    setErrorMessage('이미 가입 요청이 전송된 상태입니다. 승인을 기다려주세요.'); // errorMessage state 재활용
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
                {/* status가 success이거나, 이미 요청된 경우(success로 처리했으나 메시지가 있는 경우) */}
                {status === 'success' && (
                    <>
                        <div className="success-icon" style={{ fontSize: '4rem', color: '#4CAF50', marginBottom: '20px' }}>✓</div>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>
                            {errorMessage ? '이미 요청되었습니다' : '가입 요청 전송 완료'}
                        </h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            {errorMessage || '관리자가 승인하면 알림을 받게 됩니다.'}
                        </p>
                        <p className="sub-text" style={{ fontSize: '0.9rem', color: '#999' }}>잠시 후 홈으로 이동합니다.</p>
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
