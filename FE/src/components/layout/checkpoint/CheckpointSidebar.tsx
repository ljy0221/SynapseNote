// FE/src/components/layout/checkpoint/CheckpointSidebar.tsx
import React, { useEffect, useState } from 'react';
import { X, Clock, HelpCircle } from 'lucide-react';
import CheckpointItem from './CheckpointItem';
import DiffViewerModal from './DiffViewerModal';
import { getCheckpointsApi, createCheckpointApi, getCheckpointDetailApi } from '../../../api/checkpoint/Checkpoint.api';
import type { SlotHistory } from '../../../types/checkpoint/GetCheckpoints';
import './CheckpointSidebar.css';

interface Props {
    noteId: string;
    blockId: string;
    currentCode: string;
    onClose: () => void;
    onRestore?: (code: string) => void;
}

const CheckpointSidebar: React.FC<Props> = ({ noteId, blockId, currentCode, onClose, onRestore }) => {
    console.log('CheckpointSidebar rendered with currentCode:', currentCode); // Debugging

    const [slots, setSlots] = useState<SlotHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionSlot, setActionSlot] = useState<number | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ slot: SlotHistory; code: string } | null>(null);

    const fetchHistory = async () => {
        console.log('📥 fetchHistory called');
        setIsLoading(true);
        try {
            const data = await getCheckpointsApi(noteId, blockId);
            console.log('📊 fetchHistory received data:', data);
            console.log('📊 Content array:', data.content);
            setSlots(data.content || []);
            console.log('✅ State updated with slots');
        } catch (error) {
            console.error('❌ 히스토리 로딩 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [noteId, blockId]);

    const handleSave = async (slotNumber: number, isOverwrite: boolean) => {
        console.log('handleSave called:', { slotNumber, isOverwrite });
        if (isOverwrite && !window.confirm(`슬롯 ${slotNumber}에 이미 데이터가 있습니다. 덮어쓰시겠습니까?`)) return;

        setActionSlot(slotNumber);
        try {
            console.log('Calling createCheckpointApi:', { noteId, blockId, slotNumber });
            const result = await createCheckpointApi(noteId, blockId, slotNumber);
            console.log('✅ createCheckpointApi SUCCESS, result:', result);
            console.log('Refreshing history...');
            await fetchHistory();
            console.log('✅ History refreshed successfully');
        } catch (error: any) {
            console.error('❌ 히스토리 저장 실패:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.response?.status,
                data: error.response?.data
            });
            alert(`버전 저장에 실패했습니다.\n에러: ${error.response?.data?.message || error.message}`);
        } finally {
            setActionSlot(null);
        }
    };


    const handleRestore = async (slotNumber: number) => {
        console.log('handleRestore called:', { slotNumber });
        if (!window.confirm(`슬롯 ${slotNumber}의 버전으로 코드를 복구하시겠습니까?`)) return;

        setActionSlot(slotNumber);
        try {
            console.log('Calling getCheckpointDetailApi:', { noteId, blockId, slotNumber });
            const detail = await getCheckpointDetailApi(noteId, blockId, slotNumber);
            console.log('🔍 Restore Detail Response:', detail);

            // 데이터 추출 로직 개선: properties.code(코드블록) 또는 content(텍스트블록)
            const validContent = detail.properties?.code || detail.content || (detail as any).code || (detail as any).text;

            if (validContent) {
                onRestore?.(validContent);
                onClose();
            } else {
                alert(`해당 슬롯의 내용을 불러올 수 없습니다.\n응답 데이터: ${JSON.stringify(detail)}`);
            }
        } catch (error) {
            console.error('상세 내용 조회 실패:', error);
            alert('복구 중 오류가 발생했습니다.');
        } finally {
            setActionSlot(null);
        }
    };

    // Diff 뷰어 열기
    const handleViewDiff = async (slotNumber: number) => {
        if (actionSlot !== null) return;

        const allSlots = Array.from({ length: 5 }, (_, i) => {
            const slotNum = i + 1;
            const savedSlot = slots.find(s => s.slotNumber === slotNum);
            return savedSlot || { slotNumber: slotNum, savedAt: '', isEmpty: true };
        });

        const slot = allSlots.find(s => s.slotNumber === slotNumber);
        if (!slot || slot.isEmpty) {
            alert('저장된 데이터가 없습니다.');
            return;
        }

        setActionSlot(slotNumber);
        try {
            const detail = await getCheckpointDetailApi(noteId, blockId, slotNumber);
            console.log('🔍 Detail Response:', detail); // Debugging log

            // 데이터 추출 로직 개선: properties.code(코드블록) 또는 content(텍스트블록)
            const validContent = detail.properties?.code || detail.content || (detail as any).code || (detail as any).text;

            if (validContent) {
                setSelectedSlot({ slot, code: validContent });
            } else {
                console.error('❌ Content field is missing within:', detail);
                alert(`해당 슬롯의 내용을 불러올 수 없습니다.\n응답 데이터: ${JSON.stringify(detail)}`);
            }
        } catch (error) {
            console.error('상세 내용 조회 실패:', error);
            alert('코드 불러오기에 실패했습니다.');
        } finally {
            setActionSlot(null);
        }
    };

    // Diff 모달에서 복구
    const handleRestoreFromDiff = () => {
        if (selectedSlot && selectedSlot.code) {
            onRestore?.(selectedSlot.code);
            setSelectedSlot(null);
            onClose();
        }
    };

    // 1~5번 슬롯 생성
    const allSlots = Array.from({ length: 5 }, (_, i) => {
        const slotNum = i + 1;
        const savedSlot = slots.find(s => s.slotNumber === slotNum);
        return savedSlot || { slotNumber: slotNum, savedAt: '', isEmpty: true };
    });

    return (
        <>
            {/* 배경 오버레이 */}
            <div className="checkpoint-backdrop" onClick={onClose}></div>

            {/* 사이드바 */}
            <aside className="checkpoint-sidebar">
                <header className="checkpoint-sidebar-header">
                    <div className="header-title-wrapper">
                        <Clock size={18} className="header-icon" />
                        <h2>버전 히스토리</h2>
                    </div>
                    <button className="checkpoint-close-btn" onClick={onClose} aria-label="닫기">
                        <X size={20} />
                    </button>
                </header>

                <div className="checkpoint-list-container">
                    <div className="checkpoint-info-banner">
                        <HelpCircle size={14} />
                        <span>슬롯을 클릭하면 현재 코드와 비교할 수 있습니다.</span>
                    </div>

                    {isLoading ? (
                        <div className="checkpoint-loading">
                            <div className="loading-spinner"></div>
                            <p>히스토리 불러오는 중...</p>
                        </div>
                    ) : (
                        <ul className="checkpoint-list">
                            {allSlots.map((slot) => (
                                <CheckpointItem
                                    key={slot.slotNumber}
                                    slot={slot}
                                    isProcessing={actionSlot === slot.slotNumber}
                                    onSave={() => handleSave(slot.slotNumber, !slot.isEmpty)}
                                    onViewDiff={() => handleViewDiff(slot.slotNumber)}
                                    onRestore={() => handleRestore(slot.slotNumber)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </aside>

            {/* Diff 뷰어 모달 */}
            {selectedSlot && (
                <DiffViewerModal
                    slot={selectedSlot.slot}
                    currentCode={currentCode}
                    savedCode={selectedSlot.code}
                    onClose={() => setSelectedSlot(null)}
                    onRestore={handleRestoreFromDiff}
                />
            )}
        </>
    );
};

export default CheckpointSidebar;
