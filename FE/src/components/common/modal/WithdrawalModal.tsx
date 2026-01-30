import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './WithdrawalModal.css';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const CONFIRMATION_PHRASE = "탈퇴하겠습니다";

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [inputValue, setInputValue] = useState('');
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setInputValue(''); // 모달 열릴 때 초기화
            setIsValid(false);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setIsValid(value === CONFIRMATION_PHRASE);
    };

    if (!isOpen) return null;

    return (
        <div className="withdrawal-modal-overlay">
            <div className="withdrawal-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="withdrawal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="withdrawal-header">
                    <AlertTriangle className="withdrawal-icon" size={48} />
                    <h2 className="withdrawal-title">정말 탈퇴하시겠습니까?</h2>
                </div>

                <p className="withdrawal-description">
                    계정을 삭제하면 모든 데이터가 사라지며 복구할 수 없습니다.<br />
                    탈퇴를 진행하려면 아래 문구를 정확히 입력해주세요.
                </p>

                <div className="withdrawal-verification-section">
                    <div className="withdrawal-phrase-box">
                        "{CONFIRMATION_PHRASE}"
                    </div>

                    <input
                        type="text"
                        className="withdrawal-input"
                        placeholder="위 문구를 똑같이 입력하세요"
                        value={inputValue}
                        onChange={handleInputChange}
                        onPaste={(e) => e.preventDefault()} // 붙여넣기 방지
                    />
                </div>

                <div className="withdrawal-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        취소
                    </button>
                    <button
                        className={`btn-confirm-withdrawal ${isValid ? 'active' : ''}`}
                        onClick={onConfirm}
                        disabled={!isValid}
                    >
                        탈퇴 확인
                    </button>
                </div>
            </div>
        </div>
    );
};
