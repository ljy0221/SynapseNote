import { create } from 'zustand';

export type ModalType = 'CONFIRM' | 'NODE_SELECTOR';

export interface Modal {
    id: string;
    type: ModalType;
    props: Record<string, any>;
}

interface ModalState {
    modals: Modal[];
    openModal: (type: ModalType, props?: Record<string, any>) => string;
    closeModal: (id: string) => void;
    closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    modals: [],
    openModal: (type, props = {}) => {
        const id = Date.now().toString();
        set((state) => ({
            modals: [...state.modals, { id, type, props }],
        }));
        return id;
    },
    closeModal: (id) =>
        set((state) => ({
            modals: state.modals.filter((modal) => modal.id !== id),
        })),
    closeAll: () => set({ modals: [] }),
}));
