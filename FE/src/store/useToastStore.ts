import { create } from 'zustand';

interface ToastState {
    message: string;
    isVisible: boolean;
    type: 'success' | 'error' | 'info';
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    closeToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
    message: '',
    isVisible: false,
    type: 'success',
    showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') =>
        set({ message, isVisible: true, type }),
    closeToast: () => set({ isVisible: false }),
}));
