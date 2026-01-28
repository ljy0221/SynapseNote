import React, { useState } from 'react';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';
import SearchBar from '../../common/searchBar/SearchBar.tsx';
import WindowControlButton from '../../common/WindowControlButton/WindowControlButton.tsx'; // 임포트 추가
import SearchResultDropdown from '../../common/searchResultModal/SearchResultDropdown.tsx';
import type { SearchedNote } from '../../../types/note/searchNotes';
import { searchNotes } from '../../../utils/noteAPI';


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
        <WindowControlButton />
      </div>
    </header>
  );
};