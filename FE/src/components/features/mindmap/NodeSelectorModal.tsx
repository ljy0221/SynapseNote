import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, FileText, SortDesc } from 'lucide-react';
import './NodeSelectorModal.css';

import { getNotesApi } from '../../../api/notes/Notes.api';
import { adaptNotesForSidebar } from '../../../api/notes/Notes.adapter';
import type { NoteListItem } from '../../../types/note/GetNotes';


interface NoteItem {
    id: string;
    title: string;
    path: string;
    summary: string;
}

interface NodeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (note: NoteItem) => void;
    existingNodeIds: string[]; // [New] 이미 배치된 노드 ID 목록
}

export const NodeSelectorModal: React.FC<NodeSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    existingNodeIds = [] // 기본값 설정
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [sortByUnplaced, setSortByUnplaced] = useState(false); // [New] 미배치 우선 정렬 상태

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await getNotesApi();
                const noteList: NoteListItem[] = adaptNotesForSidebar(res);
                const mapped: NoteItem[] = noteList.map(note => ({
                    id: note.noteId,
                    title: note.title,
                    path: note.directoryPath,
                    summary: '설명 없음',
                }));
                setNotes(mapped);
            } catch (e) {
                console.error('노트 목록 로딩 실패', e);
            }
        };

        if (isOpen) {
            fetchNotes();
        }
    }, [isOpen]);

    // 검색 및 정렬 로직
    const processedNotes = useMemo(() => {
        let result = [...notes];

        // 1. 검색 필터링
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(note =>
                note.title.toLowerCase().includes(term) ||
                note.path.toLowerCase().includes(term)
            );
        }

        // 2. [New] 미배치 우선 정렬
        if (sortByUnplaced) {
            result.sort((a, b) => {
                const aPlaced = existingNodeIds.includes(a.id);
                const bPlaced = existingNodeIds.includes(b.id);
                if (!aPlaced && bPlaced) return -1; // 미배치를 위로
                if (aPlaced && !bPlaced) return 1;  // 배치를 아래로
                return 0;
            });
        }

        return result;
    }, [searchTerm, notes, sortByUnplaced, existingNodeIds]);


    if (!isOpen) return null;

    return (
        <div className="node-selector-overlay" onClick={onClose}>
            <div className="node-selector-container" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="selector-header">
                    <div className="selector-title">
                        <FileText size={20} className="text-point" style={{ color: 'var(--color-point)' }} />
                        연결할 노트 선택
                    </div>
                    <button className="selector-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* 검색창 및 정렬 도구 */}
                <div className="selector-search-area">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="selector-search-input"
                            placeholder="노트 제목 또는 경로 검색..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <button
                            className={`selector-sort-btn ${sortByUnplaced ? 'active' : ''}`}
                            onClick={() => setSortByUnplaced(!sortByUnplaced)}
                            title={sortByUnplaced ? "정렬 해제" : "미배치 노드 우선 정렬"}
                        >
                            <SortDesc size={18} />
                            <span className="sort-btn-label">미배치 우선</span>
                        </button>
                    </div>
                </div>

                {/* 노트 리스트 */}
                <div className="selector-list-area">
                    {processedNotes.length > 0 ? (
                        processedNotes.map(note => {
                            const isPlaced = existingNodeIds.includes(note.id);
                            return (
                                <div
                                    key={note.id}
                                    className={`note-item ${isPlaced ? 'placed' : ''}`}
                                    onClick={() => onSelect(note)}
                                >
                                    <div className="note-info">
                                        <div className="note-item-title">
                                            {note.title}
                                        </div>
                                        <div className="note-item-path">
                                            {note.path}
                                        </div>
                                    </div>
                                    {/* [New] 배치 상태 뱃지 */}
                                    <span className={`status-badge ${isPlaced ? 'placed' : 'not-placed'}`}>
                                        {isPlaced ? '배치완료' : '미배치'}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state">
                            <Search size={32} style={{ marginBottom: 8 }} />
                            <p>검색 결과가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

};

export default NodeSelectorModal;
