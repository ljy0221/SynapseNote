import React, { useRef, useEffect, useState } from 'react';
import { X, User as UserIcon, Edit2, Check, UserX, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WithdrawalModal } from './WithdrawalModal';
import { ModalHeader } from './ModalHeader'; // 추가
import './UserProfileModal.css';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: {
        name: string;
        email: string;
        imageUrl?: string;
    };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // 모달 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setTempName(user.name);
        }
    }, [isOpen, user]);

    const handleSaveNickname = () => {
        // TODO: API 연동
        console.log('New Nickname:', tempName);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setTempName(user?.name || '');
        setIsEditing(false);
    };

    const handleWithdrawClick = () => {
        setIsWithdrawalOpen(true);
    };

    const navigate = useNavigate();

    const handleLogout = () => {
        // 토큰 삭제
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');

        // 로그인 페이지로 이동
        navigate('/login');
        onClose();
    };

    const handleConfirmWithdraw = () => {
        console.log('Withdraw account confirmed');
        setIsWithdrawalOpen(false);
        onClose();
        // 탈퇴 후에도 로그아웃 처리 필요하면 추가
        handleLogout();
    };

    if (!isOpen) return null;

    return (
        <div className="user-profile-modal-overlay">
            <div className="user-profile-modal-content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                {/* 모달 헤더 (메인 헤더 스타일 통일) */}
                <ModalHeader onClose={onClose} />

                <div className="profile-image-wrapper">
                    {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Profile" className="profile-image" />
                    ) : (
                        <UserIcon size={40} className="profile-placeholder-icon" />
                    )}
                </div>

                <div className="profile-info-container">
                    {/* 이메일 (ID 역할) */}
                    <div className="profile-field">
                        <label className="profile-label">아이디 (Email)</label>
                        <div className="profile-value">{user?.email || '-'}</div>
                    </div>

                    {/* 닉네임 (수정 가능) */}
                    <div className="profile-field">
                        <label className="profile-label">닉네임</label>
                        <div className="profile-nickname-row">
                            {isEditing ? (
                                <div className="nickname-edit-box">
                                    <input
                                        type="text"
                                        className="nickname-input"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="nickname-action-btn save" onClick={handleSaveNickname} title="저장">
                                        <Check size={16} />
                                    </button>
                                    <button className="nickname-action-btn cancel" onClick={handleCancelEdit} title="취소">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="profile-value nickname">{user?.name || '게스트'}</div>
                                    <button className="nickname-edit-btn" onClick={() => setIsEditing(true)} title="닉네임 변경">
                                        <Edit2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 로그아웃 버튼 */}
                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={18} style={{ marginRight: 8 }} />
                    로그아웃
                </button>

                {/* 회원탈퇴 버튼 (우하단) */}
                <button className="btn-withdraw" onClick={handleWithdrawClick} title="회원 탈퇴">
                    <UserX size={14} style={{ marginRight: 4 }} />
                    회원 탈퇴
                </button>

                {/* 탈퇴 확인 모달 (Nested Modal) */}
                <WithdrawalModal
                    isOpen={isWithdrawalOpen}
                    onClose={() => setIsWithdrawalOpen(false)}
                    onConfirm={handleConfirmWithdraw}
                />
            </div>
        </div>
    );
};
