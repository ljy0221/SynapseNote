import { History } from 'lucide-react';
import React from 'react';
import './VersionButton.css';

interface VersionButtonProps {
    onClick?: () => void;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onClick }) => {
    return (
        <button
            className="code-action-btn version-btn"
            onClick={onClick}
            title="버전 기록 / 체크포인트"
        >
            <History size={18} />
        </button>
    );
};

export default VersionButton;