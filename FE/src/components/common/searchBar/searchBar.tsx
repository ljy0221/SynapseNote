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

  // Live search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm.trim());
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
