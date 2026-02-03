import React, { useState, useEffect } from 'react';
import { X, Copy, Check, RefreshCw } from 'lucide-react';
import { createInvitationApi } from '../../../api/notes/CreateInvitation.api';
import './InviteLinkModal.css';

interface InviteLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId?: string;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ isOpen, onClose, noteId }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [inviteUrl, setInviteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && noteId) {
            fetchInivitation();
        }
    }, [isOpen, noteId]);

    const fetchInivitation = async () => {
        if (!noteId) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await createInvitationApi(noteId);
            setInviteUrl(res.invitationUrl);
        } catch (err) {
            console.error(err);
            setError('초대 링크를 생성할 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // 2초 후 복귀
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers if needed, but modern browsers support clipboard API
        }
    };

    return (
        <div className="invite-modal-overlay" onClick={onClose}>
            <div className="invite-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="invite-modal-header">
                    <h3>초대 링크 공유</h3>
                    <button className="invite-modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="invite-modal-body">
                    <p className="invite-modal-description">
                        아래 링크를 복사하여 팀원들을 초대하세요.
                    </p>

                    <div className="invite-link-box">
                        <input
                            type="text"
                            readOnly
                            value={isLoading ? '링크 생성 중...' : (error || inviteUrl)}
                            className="invite-link-input"
                        />
                        <button
                            className={`invite-copy-btn ${isCopied ? 'copied' : ''}`}
                            onClick={handleCopy}
                            title="링크 복사"
                            disabled={isLoading || !!error}
                        >
                            {isCopied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    {isCopied && <span className="invite-copy-feedback">링크가 복사되었습니다!</span>}
                </div>
            </div>
        </div>
    );
};
