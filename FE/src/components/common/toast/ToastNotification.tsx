import React, { useEffect } from 'react';
import './ToastNotification.css';

interface ToastNotificationProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
    type?: 'success' | 'error' | 'info' | 'warning'; // [New] 타입 추가
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
    message,
    isVisible,
    onClose,
    duration = 2000,
    type = 'success' // 기본값 success
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-notification ${type}`}>
            {message}
        </div>
    );
};
