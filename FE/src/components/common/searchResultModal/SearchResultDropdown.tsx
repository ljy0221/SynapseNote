import { useEffect, useRef } from 'react';
import './SearchResultDropdown.css';
import type { SearchedNote } from '../../../types/note/SearchNotes';

interface SearchResultDropdownProps {
  query: string;
  results: SearchedNote[];
  isLoading: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

const SearchResultDropdown: React.FC<SearchResultDropdownProps> = ({
  query,
  results,
  isLoading,
  onClose,
  onSelectNote,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ESC 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 바깥 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="search-dropdown" ref={dropdownRef}>
      <div className="search-dropdown-header">
        Search results for “{query}”
      </div>


      <div className="search-dropdown-content">
        {isLoading && (
          <div className="search-dropdown-state">
            검색 중...
          </div>
        )}

        {!isLoading && results.length === 0 && (
          <div className="search-dropdown-state">
            검색 결과가 없습니다.
          </div>
        )}

        {!isLoading &&
          results.map(note => (
            <div
              key={note.id}
              className="search-dropdown-item"
              onClick={() => onSelectNote(note.id)}
            >
              <div className="search-dropdown-title">
                {note.title}
              </div>
              <div className="search-dropdown-path">
                {note.directoryPath}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SearchResultDropdown;
