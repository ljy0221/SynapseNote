import React from 'react';
import { useModalStore, ModalType } from '../../../store/useModalStore';
import ConfirmModal from './ConfirmModal';
import { NodeSelectorModal } from '../../features/mindmap/NodeSelectorModal';

const MODAL_COMPONENTS: Record<ModalType, React.FC<any>> = {
    CONFIRM: ConfirmModal,
    NODE_SELECTOR: NodeSelectorModal,
};

const GlobalModal: React.FC = () => {
    const { modals, closeModal } = useModalStore();

    return (
        <>
            {modals.map((modal) => {
                const Component = MODAL_COMPONENTS[modal.type];
                if (!Component) return null;

                return (
                    <Component
                        key={modal.id}
                        isOpen={true} // GlobalModal에서 렌더링되므로 항상 true
                        onClose={() => closeModal(modal.id)}
                        {...modal.props}
                    />
                );
            })}
        </>
    );
};

export default GlobalModal;
