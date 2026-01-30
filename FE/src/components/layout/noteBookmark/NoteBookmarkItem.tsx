import type { BookmarkNoteItem } from '../../../types/bookmark/GetBookmarks';
import { Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './NoteBookmark.css';

interface Props {
  note: BookmarkNoteItem;
  onRemove?: (noteId: string) => void;
}

const NoteBookmarkItem = ({ note, onRemove }: Props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/note/${note.noteId}`);
  };

  return (
    <li className="note-bookmark-card" onClick={handleClick}>
      {/* 아이콘 */}
      <div className="note-card-icon">
        <FileText size={18} />
      </div>

      {/* 내용 */}
      <div className="note-card-content">
        <div className="note-card-title">{note.title}</div>
        <div className="note-card-path">{note.directoryPath}</div>
      </div>

      {/* 즐겨찾기 제거 */}
      <button
        className="note-bookmark-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.(note.noteId);
        }}
        aria-label="즐겨찾기 제거"
      >
        <Trash2 size={14} strokeWidth={2}/>
      </button>
    </li>
  );
};

export default NoteBookmarkItem;
