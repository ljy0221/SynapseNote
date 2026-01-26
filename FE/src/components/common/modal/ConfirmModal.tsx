import React from 'react';
import { Check, X } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <p className="modal-message">
                    {/* 메시지 내의 강조 부분을 파싱하거나 그대로 렌더링 */}
                    {message}
                </p>
                <div className="modal-actions">
                    <button
                        className="modal-btn btn-confirm"
                        onClick={onConfirm}
                        title="확인 (Confirm)"
                        aria-label="Confirm"
                    >
                        <Check size={24} />
                    </button>
                    <button
                        className="modal-btn btn-cancel"
                        onClick={onCancel}
                        title="취소 (Cancel)"
                        aria-label="Cancel"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
