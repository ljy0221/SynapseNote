import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import './searchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live search with debouncing
  useEffect(() => {
    // 1. 초기 마운트 시점 실행 방지
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 2. 검색어가 비어있을 때 처리 (Header에서 이미 처리 중이지만 여기서도 방어)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      onSearch(searchTerm.trim());
    }, 400); // 400ms로 약간 더 여유 있게 조정

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm, onSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 3. 엔터를 눌렀을 때 기존 타이머 제거하여 중복 요청 방지
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch(searchTerm.trim());
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-form" onClick={handleContainerClick}>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search note by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="search-button" aria-label="검색">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
