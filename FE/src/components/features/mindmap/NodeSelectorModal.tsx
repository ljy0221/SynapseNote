import React, { useState, useMemo } from 'react';
import { X, Search, FileText, ChevronRight } from 'lucide-react';
import './NodeSelectorModal.css';

interface NoteItem {
    id: string;
    title: string;
    path: string;
    summary: string;
}

import { mockNotes } from '../../layout/sidebar/Sidebar'; // Sidebar에서 목업 데이터 임포트

// [Mock Data] Sidebar의 목업 데이터를 NoteItem 형식으로 변환
const MOCK_NOTES: NoteItem[] = mockNotes.map(note => ({
    id: note.noteId,
    title: note.title,
    path: note.directoryPath,
    summary: '설명 없음' // 목업 데이터에 설명이 없으므로 기본값 설정
}));

interface NodeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (note: NoteItem) => void;
}

export const NodeSelectorModal: React.FC<NodeSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // 검색 로직
    const filteredNotes = useMemo(() => {
        if (!searchTerm) return MOCK_NOTES;
        const term = searchTerm.toLowerCase();
        return MOCK_NOTES.filter(note =>
            note.title.toLowerCase().includes(term) ||
            note.path.toLowerCase().includes(term)
        );
    }, [searchTerm]);

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
                        filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="note-item"
                                onClick={() => onSelect(note)}
                            >
                                <div className="note-item-title">
                                    {note.title}
                                </div>
                                <div className="note-item-path">
                                    {note.path}
                                </div>
                            </div>
                        ))
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
