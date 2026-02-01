import React from 'react';
import { Lock } from 'lucide-react';
import './ModalHeader.css';

interface ModalHeaderProps {
    onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => {
    return (
        <div className="modal-header-container">
            {/* Spacer for balance */}
            <div style={{ width: '12px' }}></div>
            <div className="modal-address-bar">
                <Lock size={10} className="address-bar-icon" />
                <span className="address-bar-url">synapse.com/userInfo</span>
            </div>
            <div className="modal-header-controls">
                <button className="modal-control-btn close" onClick={onClose} title="닫기" />
            </div>
        </div>
    );
};
