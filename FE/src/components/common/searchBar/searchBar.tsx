import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // 컴포넌트 임포트
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'; // 돋보기 아이콘 임포트
import './searchBar.css';

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    console.log('시냅스 검색어:', searchTerm);
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Search file by name or content..."
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