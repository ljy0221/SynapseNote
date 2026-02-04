import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import './VersionButton.css';

interface VersionButtonProps {
    onClick?: () => void;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onClick }) => {
    return (
        <button className="code-action-btn version-btn" onClick={onClick} title="버전 관리">
            <HistoryIcon size={16} />
        </button>
    );
};

export default VersionButton;