import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SummaryStyle } from '../../../types/ai/NoteSummary';
import './SummaryConfigModal.css';

interface SummaryConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (style: SummaryStyle) => void;
    isLoading: boolean;
}

export const SummaryConfigModal: React.FC<SummaryConfigModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    isLoading,
}) => {
    const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>('concise');

    const handleGenerate = () => {
        onGenerate(selectedStyle);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="summary-modal-overlay" onClick={onClose}>
            <div className="summary-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="summary-modal-header">
                    <h3>AI 요약 설정</h3>
                    <button className="summary-modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="summary-config-content">
                    <div className="summary-option-group">
                        <label>요약 스타일 선택</label>
                        <select
                            className="summary-style-select"
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value as SummaryStyle)}
                            disabled={isLoading}
                        >
                            <option value="concise">간결하게 (2-3문장)</option>
                            <option value="detailed">상세하게 (1-2단락)</option>
                            <option value="bullet-points">불릿 포인트 (5-7개)</option>
                        </select>
                    </div>

                    <div className="summary-info-text">
                        <p>선택한 스타일에 맞춰 AI가 노트 내용을 분석하고 요약합니다.</p>
                    </div>

                    <div className="summary-action-buttons">
                        <button className="cancel-btn" onClick={onClose}>취소</button>
                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={isLoading}
                        >
                            {isLoading ? '생성 중...' : '요약 생성'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
