import React, { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';
import { createInvitationApi } from '../../../api/notes/CreateInvitation.api';
import { useToastStore } from '../../../store/useToastStore';
import './InviteLinkModal.css';

interface InviteLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId?: string;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ isOpen, onClose, noteId }) => {
    const { showToast } = useToastStore();
    const [inviteUrl, setInviteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [expiration, setExpiration] = useState(604800);

    useEffect(() => {
        if (isOpen && noteId) {
            fetchInivitation();
        }
    }, [isOpen, noteId, expiration]); // expiration 변경 시 다시 호출

    const fetchInivitation = async () => {
        if (!noteId) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await createInvitationApi(noteId, 'EDITOR', expiration);
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
            showToast('링크가 복사되었습니다.', 'success');
            onClose();
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('링크 복사에 실패했습니다.', 'error');
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
                        <select
                            className="invite-expiration-select"
                            value={expiration}
                            onChange={(e) => setExpiration(Number(e.target.value))}
                            disabled={isLoading}
                        >
                            <option value={1800}>30분</option>
                            <option value={3600}>1시간</option>
                            <option value={86400}>1일</option>
                            <option value={604800}>7일</option>
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={isLoading ? '링크 생성 중...' : (error || inviteUrl)}
                            className="invite-link-input"
                        />
                        <button
                            className="invite-copy-btn"
                            onClick={handleCopy}
                            title="링크 복사"
                            disabled={isLoading || !!error}
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
