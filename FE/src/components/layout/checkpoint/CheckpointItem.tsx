// FE/src/components/layout/checkpoint/CheckpointItem.tsx
import React from 'react';
import { RotateCcw, Database, Save } from 'lucide-react';
import type { SlotHistory } from '../../../types/checkpoint/GetCheckpoints';
import './CheckpointItem.css';

interface Props {
    slot: SlotHistory;
    isProcessing: boolean;
    onSave: () => void;
    onViewDiff: () => void;
    onRestore: () => void;
}

const CheckpointItem: React.FC<Props> = ({ slot, isProcessing, onSave, onViewDiff, onRestore }) => {
    const { slotNumber, savedAt, isEmpty } = slot;

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <li
            className={`checkpoint-item ${isEmpty ? 'empty' : 'saved'}`}
            onClick={() => {
                if (!isEmpty && !isProcessing) {
                    onViewDiff();
                }
            }}
            style={{ cursor: isEmpty || isProcessing ? 'default' : 'pointer' }}
            title={isEmpty ? '' : '클릭하여 현재 코드와 비교'}
        >
            <div className="checkpoint-item-header">
                <div className="checkpoint-title-group">
                    <span className="checkpoint-badge">SLOT {slotNumber}</span>
                    {!isEmpty && <span className="checkpoint-date">{formatDate(savedAt)}</span>}
                </div>
                <div className="checkpoint-item-actions">
                    <button
                        className="slot-btn save"
                        title="현재 버전 저장"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave();
                        }}
                        disabled={isProcessing}
                    >
                        <Save size={14} />
                        <span>저장</span>
                    </button>
                    {!isEmpty && (
                        <>
                            <button
                                className="slot-btn restore"
                                title="이 버전으로 복구"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRestore();
                                }}
                                disabled={isProcessing}
                            >
                                <RotateCcw size={14} />
                                <span>복구</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="checkpoint-content-info">
                <div className="checkpoint-slot-visual">
                    <Database size={16} className={isEmpty ? 'empty-icon' : 'saved-icon'} />
                    <span>{isEmpty ? '저장된 데이터 없음' : '클릭하여 코드 비교'}</span>
                </div>
            </div>

            {isProcessing && (
                <div className="slot-processing-overlay">
                    <div className="loading-spinner-small"></div>
                </div>
            )}
        </li>
    );
};

export default CheckpointItem;
