import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate 추가
import { useAuthStore } from '../../../store/useAuthStore';
import './Header.css';
import { ThemeManager } from '../../features/theme/ThemeManager';
import SearchBar from '../../common/searchBar/searchBar.tsx';
import SearchResultDropdown from '../../common/searchResultModal/SearchResultDropdown.tsx';
import type { SearchedNote } from '../../../types/note/SearchNotes.ts';
import WindowControlButton from '../../common/WindowControlButton/WindowControlButton.tsx';
import { searchNotes } from '../../../utils/noteAPI';

// Header component

interface HeaderProps {
  isSidebarActive: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const navigate = useNavigate(); // 2. navigate 훅 사용
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchedNote[]>([]);
  const [isSearching, setIsSearching] = useState(false);


  const handleSearch = React.useCallback(async (query: string) => {
    if (!query) {
      setSearchQuery(null);
      setSearchResults([]);
      return;
    }

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
  }, []);

  return (
    <header className="main-header">

      <div className="header-search-zone">
        <div className="search-bar-wrapper">
          <SearchBar onSearch={handleSearch} />

          {searchQuery && (
            <SearchResultDropdown
              query={searchQuery}
              results={searchResults}
              isLoading={isSearching}
              currentMemberId={useAuthStore.getState().userInfo?.memberId}
              onClose={() => setSearchQuery(null)}
              onSelectNote={(noteId) => {
                console.log('선택한 노트:', noteId);
                navigate(`/note/${noteId}`); // 3. 해당 노트 페이지로 이동
                setSearchQuery(null); // 이동 후 검색창 닫기
              }}
            />
          )}
        </div>
      </div>

      <div className="header-right-zone">
        {/* 테마 토글 버튼 */}
        <ThemeManager />
        {/* 가장 우측에 배치되는 맥 스타일 컨트롤 버튼 */}
        <WindowControlButton />
      </div>
    </header>
  );
};