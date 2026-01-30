import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ToastNotification } from '../components/common/toast/ToastNotification';

interface ToastContextType {
    showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');

    const showToast = useCallback((msg: string) => {
        setMessage(msg);
        setIsVisible(true);
    }, []);

    const closeToast = useCallback(() => {
        setIsVisible(false);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastNotification
                message={message}
                isVisible={isVisible}
                onClose={closeToast}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
