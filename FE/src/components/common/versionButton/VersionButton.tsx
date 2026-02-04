import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { Tooltip } from '../tooltip/Tooltip';
import './VersionButton.css';

interface VersionButtonProps {
    onClick?: () => void;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onClick }) => {
    return (
        <Tooltip title="버전 관리" placement="bottom">
            <button className="code-action-btn version-btn" onClick={onClick}>
                <HistoryIcon size={16} />
            </button>
        </Tooltip>
    );
};

export default VersionButton;