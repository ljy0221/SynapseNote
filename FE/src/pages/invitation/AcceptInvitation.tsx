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
                setStatus('error');
                setErrorMessage(err.response?.data?.message || '초대 수락 중 오류가 발생했습니다.');
            }
        };

        processInvitation();
    }, [token, navigate, isAuthenticated, isLoading]);

    return (
        <div className="accept-invitation-container">
            <div className="accept-card">
                {status === 'loading' && (
                    <>
                        <div className="spinner"></div>
                        <p>초대를 확인하고 있습니다...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="success-icon">✓</div>
                        <p>가입 요청이 전송되었습니다. 관리자가 승인하면 알림을 받게 됩니다.</p>
                        <p className="sub-text">잠시 후 홈으로 이동합니다.</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="error-icon">!</div>
                        <p className="error-text">{errorMessage}</p>
                        <button onClick={() => navigate('/home')}>홈으로 가기</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvitation;
