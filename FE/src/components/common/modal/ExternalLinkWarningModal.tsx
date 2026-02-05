
import React from 'react';

interface ExternalLinkWarningModalProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ExternalLinkWarningModal: React.FC<ExternalLinkWarningModalProps> = ({
    url,
    isOpen,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h4>⚠️ 외부 링크 연결 경고</h4>
                </div>
                <div className="modal-body">
                    <p>다음 링크로 이동하려고 합니다:</p>
                    <p style={{
                        color: 'var(--color-point)',
                        wordBreak: 'break-all',
                        margin: '10px 0',
                        fontWeight: 600
                    }}>
                        {url}
                    </p>
                    <p>외부 브라우저에서 열겠습니까?</p>
                </div>
                <div className="modal-footer">
                    <button className="modal-btn cancel" onClick={onClose}>
                        취소
                    </button>
                    <button className="modal-btn confirm" onClick={onConfirm}>
                        열기
                    </button>
                </div>
            </div>
        </div>
    );
};
