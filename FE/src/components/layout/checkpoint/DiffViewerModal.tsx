// FE/src/components/layout/checkpoint/DiffViewerModal.tsx
import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { X, RotateCcw, Clock } from 'lucide-react';
import type { SlotHistory } from '../../../types/checkpoint/GetCheckpoints';
import './DiffViewerModal.css';

interface Props {
    slot: SlotHistory;
    currentCode: string;
    savedCode: string;
    onClose: () => void;
    onRestore: () => void;
}

const DiffViewerModal: React.FC<Props> = ({ slot, currentCode, savedCode, onClose, onRestore }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleRestore = () => {
        if (window.confirm('이 버전으로 코드를 복구하시겠습니까?')) {
            onRestore();
        }
    };

    return (
        <>
            {/* 배경 오버레이 */}
            <div className="diff-modal-backdrop" onClick={onClose}></div>

            {/* 모달 */}
            <div className="diff-modal">
                {/* 헤더 */}
                <div className="diff-modal-header">
                    <div className="diff-modal-title">
                        <Clock size={20} />
                        <div>
                            <h2>버전 비교 - 슬롯 {slot.slotNumber}</h2>
                            <span className="diff-modal-subtitle">
                                저장 시간: {formatDate(slot.savedAt)}
                            </span>
                        </div>
                    </div>
                    <button className="diff-modal-close" onClick={onClose} aria-label="닫기">
                        <X size={24} />
                    </button>
                </div>

                {/* Diff 뷰어 */}
                <div className="diff-modal-content">
                    <ReactDiffViewer
                        oldValue={savedCode}
                        newValue={currentCode}
                        splitView={true}
                        leftTitle="저장된 버전"
                        rightTitle="현재 버전"
                        showDiffOnly={false}
                        // useDarkTheme={true} // 제거: 앱 테마에 따름
                        styles={{
                            variables: {
                                // 라이트/다크 모드 상관없이 CSS 변수로 제어
                                light: {
                                    diffViewerBackground: 'var(--color-main)',
                                    diffViewerColor: 'var(--font-color)',
                                    addedBackground: 'rgba(46, 160, 67, 0.15)',
                                    addedColor: 'var(--font-color)', // 글자색은 테마 따름
                                    removedBackground: 'rgba(248, 81, 73, 0.15)',
                                    removedColor: 'var(--font-color)',
                                    wordAddedBackground: 'rgba(46, 160, 67, 0.3)',
                                    wordRemovedBackground: 'rgba(248, 81, 73, 0.3)',
                                    addedGutterBackground: 'rgba(46, 160, 67, 0.1)',
                                    removedGutterBackground: 'rgba(248, 81, 73, 0.1)',
                                    gutterBackground: 'var(--color-sub)',
                                    gutterBackgroundDark: 'var(--color-sub)',
                                    highlightBackground: 'rgba(255, 255, 255, 0.1)',
                                    highlightGutterBackground: 'rgba(255, 255, 255, 0.2)',
                                    codeFoldGutterBackground: 'var(--color-sub)',
                                    codeFoldBackground: 'var(--color-sub)',
                                    emptyLineBackground: 'var(--color-sub)',
                                    gutterColor: 'var(--font-color-sub)',
                                    addedGutterColor: 'var(--font-color)',
                                    removedGutterColor: 'var(--font-color)',
                                    codeFoldContentColor: 'var(--font-color-sub)',
                                    diffViewerTitleBackground: 'var(--color-sub)',
                                    diffViewerTitleColor: 'var(--font-color)',
                                    diffViewerTitleBorderColor: 'var(--color-border)',
                                },
                                // 다크 모드일 때도 동일하게 CSS 변수 사용하도록 설정 (라이브러리가 자동 감지시)
                                dark: {
                                    diffViewerBackground: 'var(--color-main)',
                                    diffViewerColor: 'var(--font-color)',
                                    addedBackground: 'rgba(46, 160, 67, 0.15)',
                                    addedColor: 'var(--font-color)',
                                    removedBackground: 'rgba(248, 81, 73, 0.15)',
                                    removedColor: 'var(--font-color)',
                                    wordAddedBackground: 'rgba(46, 160, 67, 0.3)',
                                    wordRemovedBackground: 'rgba(248, 81, 73, 0.3)',
                                    addedGutterBackground: 'rgba(46, 160, 67, 0.1)',
                                    removedGutterBackground: 'rgba(248, 81, 73, 0.1)',
                                    gutterBackground: 'var(--color-sub)',
                                    gutterBackgroundDark: 'var(--color-sub)',
                                    highlightBackground: 'rgba(255, 255, 255, 0.1)',
                                    highlightGutterBackground: 'rgba(255, 255, 255, 0.2)',
                                    codeFoldGutterBackground: 'var(--color-sub)',
                                    codeFoldBackground: 'var(--color-sub)',
                                    emptyLineBackground: 'var(--color-sub)',
                                    gutterColor: 'var(--font-color-sub)',
                                    addedGutterColor: 'var(--font-color)',
                                    removedGutterColor: 'var(--font-color)',
                                    codeFoldContentColor: 'var(--font-color-sub)',
                                    diffViewerTitleBackground: 'var(--color-sub)',
                                    diffViewerTitleColor: 'var(--font-color)',
                                    diffViewerTitleBorderColor: 'var(--color-border)',
                                }
                            },
                            contentText: {
                                fontFamily: 'var(--font-family-mono, monospace)',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            },
                            line: {
                                '&:hover': {
                                    background: 'var(--color-hover) !important',
                                },
                            },
                            gutter: {
                                minWidth: '50px',
                                padding: '0 8px',
                            }
                        }}
                    />
                </div>

                {/* 액션 버튼 */}
                <div className="diff-modal-actions">
                    <button className="diff-btn diff-btn-cancel" onClick={onClose}>
                        취소
                    </button>
                    <button className="diff-btn diff-btn-restore" onClick={handleRestore}>
                        <RotateCcw size={16} />
                        이 버전으로 복구
                    </button>
                </div>
            </div>
        </>
    );
};

export default DiffViewerModal;
