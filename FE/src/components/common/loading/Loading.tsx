import React from 'react';
import './Loading.css';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
    message = 'Loading...',
    fullScreen = false
}) => {
    return (
        <div
            className="loading-overlay"
            style={fullScreen ? { position: 'fixed' } : {}}
        >
            <div className="loading-content">
                <div className="loading-spinner"></div>
                <div className="loading-text">{message}</div>
            </div>
        </div>
    );
};
