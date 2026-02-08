import React from 'react';
import { Check } from 'lucide-react';
import './AlertModal.css';

interface AlertModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <p className="modal-message">
                    {message}
                </p>
                <div className="modal-actions">
                    <button
                        className="modal-btn btn-confirm"
                        onClick={onClose}
                        title="확인 (OK)"
                        aria-label="OK"
                    >
                        <Check size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
