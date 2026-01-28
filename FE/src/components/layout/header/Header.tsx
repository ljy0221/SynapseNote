import React, { useState } from 'react';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';
import SearchBar from '../../common/searchBar/searchBar.tsx';
import SearchResultDropdown from '../../common/searchResultModal/SearchResultDropdown.tsx';
import type { SearchedNote } from '../../../types/note/searchNotes';
import WindowControlButton from '../../common/WindowControlButton/WindowControlButton.tsx';

// Electron 전용 컴포넌트 (웹 빌드에서는 사용 안 함)
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
      {/* 왼쪽과 중앙 사이의 드래그 핸들 */}
      <div className="drag-handle" />

      <div className="header-search-zone">
        <div className="search-bar-wrapper">
          <SearchBar
            onSearch={(query) => {
              setSearchQuery(query);
              setIsSearching(true);

              setTimeout(() => {
                setSearchResults([
                  {
                    id: 'mock-1',
                    title: '테스트중입니다',
                    directoryPath: '/',
                    pointX: null,
                    pointY: null,
                    createdBy: '',
                    createdByName: '',
                    createdAt: '',
                    updatedAt: '',
                  },
                ]);
                setIsSearching(false);
              }, 400);
            }}
          />

          {searchQuery && (
            <SearchResultDropdown
              query={searchQuery}
              results={searchResults}
              isLoading={isSearching}
              onClose={() => setSearchQuery(null)}
              onSelectNote={(noteId) => {
                console.log('선택한 노트:', noteId);
                setSearchQuery(null);
              }}
            />
          )}
        </div>
      </div>

      {/* 중앙과 오른쪽 사이의 드래그 핸들 */}
      <div className="drag-handle" />


      <div className="header-right-zone">
        {/* 테마 토글 버튼 */}
        <ThemeManager />
        {/* 가장 우측에 배치되는 맥 스타일 컨트롤 버튼 */}
        {isElectron && <WindowControlButton />}
      </div>
    </header>
  );
};