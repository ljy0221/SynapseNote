import React, { useEffect } from 'react';
import './ToastNotification.css';

interface ToastNotificationProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
    message,
    isVisible,
    onClose,
    duration = 2000
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
        <div className="toast-notification">
            {message}
        </div>
    );
};
