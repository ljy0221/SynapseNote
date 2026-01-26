import React from 'react';
import './VersionButton.css';

interface VersionButtonProps {
    onClick?: () => void;
}

const VersionButton: React.FC<VersionButtonProps> = ({ onClick }) => {
    return (
        <button className="code-action-btn version-btn" onClick={onClick}>
            버전관리
        </button>
    );
};

export default VersionButton;