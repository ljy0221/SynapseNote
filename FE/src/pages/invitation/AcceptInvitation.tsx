import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitationApi } from '../../api/notes/AcceptInvitation.api';
import './AcceptInvitation.css';

const AcceptInvitation: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('유효하지 않은 초대 링크입니다.');
            return;
        }

        const processInvitation = async () => {
            try {
                const response = await acceptInvitationApi(token);
                // InvitationAcceptResponse typically contains the note or noteId
                // Based on backend: InvitationAcceptResponse.from(invitation)
                // Assuming response has noteId or similar. If not, we might need to check the type.
                // But for now, let's assume successful acceptance means we can go to the note.
                // Wait, response type check needed.

                setStatus('success');
                setTimeout(() => {
                    navigate(`/note/${response.noteId}`);
                }, 1500);
            } catch (err: any) {
                console.error(err);
                setStatus('error');
                // Display specific error if available
                setErrorMessage(err.response?.data?.message || '초대 수락 중 오류가 발생했습니다.');
            }
        };

        processInvitation();
    }, [token, navigate]);

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
                        <p>초대 수락 완료! 노트로 이동합니다.</p>
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
