import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { Tooltip } from '../tooltip/Tooltip';
import './VersionButton.css';

interface VersionButtonProps {
    onClick?: () => void;
    disabled?: boolean;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onClick, disabled }) => {
    return (
        <Tooltip title={disabled ? "읽기 전용 모드" : "버전 관리"} placement="bottom">
            <button
                className={`code-action-btn version-btn ${disabled ? 'disabled' : ''}`}
                onClick={onClick}
                disabled={disabled}
            >
                <HistoryIcon size={16} />
            </button>
        </Tooltip>
    );
};

export default VersionButton;