import React, { useState } from 'react';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';
import SearchBar from '../../common/searchBar/searchBar.tsx';
import SearchResultDropdown from '../../common/searchResultModal/SearchResultDropdown.tsx';
import type { SearchedNote } from '../../../types/note/SearchNotes.ts';
import WindowControlButton from '../../common/WindowControlButton/WindowControlButton.tsx';
import { searchNotes } from '../../../utils/noteAPI';

// Electron 전용 컴포넌트 여부 확인
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

interface HeaderProps {
    isSidebarActive: boolean;
    onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<SearchedNote[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    return (
        <header className="main-header">
            {/* 왼쪽 드래그 핸들 (사이드바 버튼 영역 옆 공간 확보) */}
            <div className="drag-handle" />

            <div className="header-search-zone">
                <div className="search-bar-wrapper">
                    <SearchBar
                        onSearch={async (query) => {
                            setSearchQuery(query);
                            setIsSearching(true);

                            try {
                                const results = await searchNotes(query);
                                setSearchResults(results);
                            } catch (error) {
                                console.error('검색 실패:', error);
                                setSearchResults([]);
                            } finally {
                                setIsSearching(false);
                            }
                        }}
                    />

                    {/* 검색어가 있을 때만 결과 드롭다운 표시 */}
                    {searchQuery && (
                        <SearchResultDropdown
                            query={searchQuery}
                            results={searchResults}
                            isLoading={isSearching}
                            onClose={() => setSearchQuery(null)}
                            onSelectNote={(noteId) => {
                                console.log('선택한 노트:', noteId);
                                // 이동 로직은 필요시 추가 (예: navigate(`/note/${noteId}`))
                                setSearchQuery(null);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 중앙과 오른쪽 사이의 드래그 핸들 */}
            <div className="drag-handle" />

            <div className="header-right-zone">
                {/* 테마 토글 버튼 (ThemeManager 내부에서 ThemeToggle 사용) */}
                <ThemeManager />
                {/* Electron 환경일 때만 표시되거나 혹은 조건에 따라 렌더링되는 윈도우 컨트롤 버튼 */}
                <WindowControlButton />
            </div>
        </header>
    );
};