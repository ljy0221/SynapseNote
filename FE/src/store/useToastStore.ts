import { create } from 'zustand';

interface ToastState {
    message: string;
    isVisible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    closeToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
    message: '',
    isVisible: false,
    type: 'success',
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') =>
        set({ message, isVisible: true, type }),
    closeToast: () => set({ isVisible: false }),
}));
