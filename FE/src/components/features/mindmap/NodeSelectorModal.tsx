import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, FileText, ChevronRight } from 'lucide-react';
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

    // ... (useEffect, filteredNotes 로직 유지) ...

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

    // 검색 로직
    const filteredNotes = useMemo(() => {
        if (!searchTerm) return notes;
        const term = searchTerm.toLowerCase();
        return notes.filter(note =>
            note.title.toLowerCase().includes(term) ||
            note.path.toLowerCase().includes(term)
        );
    }, [searchTerm, notes]);


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

                {/* 검색창 */}
                <div className="selector-search-area">
                    <input
                        type="text"
                        className="selector-search-input"
                        placeholder="노트 제목 또는 경로 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* 노트 리스트 */}
                <div className="selector-list-area">
                    {filteredNotes.length > 0 ? (
                        filteredNotes.map(note => {
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
