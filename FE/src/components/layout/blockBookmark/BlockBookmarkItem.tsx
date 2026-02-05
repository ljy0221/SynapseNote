// BlockBookmarkItem.tsx
import { Trash2, FileText, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BookmarkBlock } from '../../../types/bookmark/BookmarkBlockResponse';

interface Props {
  block: BookmarkBlock;
  onRemove?: (noteId: string, blockId: string) => void;
}

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const BlockBookmarkItem = ({ block, onRemove }: Props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // blockId를 query/hash로 넘겨서 해당 위치로 스크롤
    navigate(`/note/${block.noteId}?block=${block.blockId}`);
  };

  const plainContent = stripHtml(block.content);

  return (
    <li className="block-bookmark-card" onClick={handleClick}>
      {/* 아이콘 */}
      <div className="block-card-icon">
        {block.type === 'code' ? <Code size={16} /> : <FileText size={16} />}
      </div>

      {/* 내용 */}
      <div className="block-card-content">
        <div className="block-card-preview">
          {plainContent.length > 15 ? `${plainContent.slice(0, 15)}...` : plainContent}
        </div>
      </div>

      {/* 제거 */}
      <button
        className="block-bookmark-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.(block.noteId, block.blockId);
        }}
        aria-label="즐겨찾기 해제"
      >
        <Trash2 size={14} strokeWidth={2} />
      </button>
    </li >
  );
};

export default BlockBookmarkItem;
