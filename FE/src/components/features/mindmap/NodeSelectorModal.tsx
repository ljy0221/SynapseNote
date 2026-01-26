import React, { useState, useMemo } from 'react';
import { X, Search, FileText, ChevronRight } from 'lucide-react';
import './NodeSelectorModal.css';

interface NoteItem {
    id: string;
    title: string;
    path: string;
    summary: string;
}

// [Mock Data] 현재 백엔드가 없으므로 더미 데이터 사용
const MOCK_NOTES: NoteItem[] = [
    { id: 'n1', title: '인공신경망 기초', path: '/AI/DeepLearning/Basics', summary: '퍼셉트론과 활성화 함수에 대한 기본 개념 정리' },
    { id: 'n2', title: 'React Hooks 심화', path: '/Frontend/React/Hooks', summary: 'useMemo와 useCallback의 정확한 사용 시점' },
    { id: 'n3', title: '프로젝트 기획서', path: '/Projects/S14/Planning', summary: '시냅스 프로젝트의 핵심 기능 명세 및 일정' },
    { id: 'n4', title: '알고리즘: DFS/BFS', path: '/CS/Algorithm/Graph', summary: '그래프 탐색 기법의 차이점과 구현 예제' },
    { id: 'n5', title: 'TypeScript 제네릭', path: '/Frontend/TypeScript', summary: '유연한 컴포넌트 설계를 위한 제네릭 활용법' },
    { id: 'n6', title: '디자인 시스템 구축', path: '/Design/System', summary: '일관된 UI/UX를 위한 토큰 및 컴포넌트 가이드' },
    { id: 'n7', title: 'Docker 컨테이너', path: '/DevOps/Docker', summary: '개발 환경 격리 및 배포 자동화 기초' },
    { id: 'n8', title: 'Spring Boot Security', path: '/Backend/Spring', summary: 'JWT 인증 방식과 필터 체인 이해하기' },
];

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
