import React, { lazy, Suspense } from 'react';
import { useModalStore, ModalType } from '../../../store/useModalStore';

// Lazy load modal components
const ConfirmModal = lazy(() => import('./ConfirmModal'));
const ExternalLinkWarningModal = lazy(() => import('./ExternalLinkWarningModal').then(module => ({ default: module.ExternalLinkWarningModal })));
const NodeSelectorModal = lazy(() => import('../../features/mindmap/NodeSelectorModal').then(module => ({ default: module.NodeSelectorModal })));

const MODAL_COMPONENTS: Record<ModalType, React.LazyExoticComponent<React.FC<any>>> = {
    CONFIRM: ConfirmModal,
    NODE_SELECTOR: NodeSelectorModal,
    EXTERNAL_LINK_WARNING: ExternalLinkWarningModal,
};

const GlobalModal: React.FC = () => {
    const { modals, closeModal } = useModalStore();

    return (
        <>
            {modals.map((modal) => {
                const Component = MODAL_COMPONENTS[modal.type];
                if (!Component) return null;

                return (
                    <Suspense key={modal.id} fallback={null}>
                        <Component
                            isOpen={true} // GlobalModal에서 렌더링되므로 항상 true
                            onClose={() => closeModal(modal.id)}
                            onCancel={() => closeModal(modal.id)}
                            {...modal.props}
                        />
                    </Suspense>
                );
            })}
        </>
    );
};

export default GlobalModal;
