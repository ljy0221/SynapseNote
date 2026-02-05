// BlockBookmarkList.tsx
import { useState, useEffect } from 'react';
import { BookDashed } from 'lucide-react';
import BlockBookmarkItem from './BlockBookmarkItem';
import type { GetBookmarkBlocksResponse } from '../../../types/bookmark/BookmarkBlockResponse';
import { getBlockBookmarksApi, removeBlockBookmarkApi } from '../../../api/bookmark/Bookmarks.api';

const BlockBookmarkList = () => {
  const [blocks, setBlocks] = useState<GetBookmarkBlocksResponse['content']>([]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await getBlockBookmarksApi({ page: 1, size: 10 });
        setBlocks(response.content);
      } catch (error) {
        console.error('Failed to fetch block bookmarks:', error);
      }
    };
    fetchBookmarks();
  }, []);

  const handleRemove = async (noteId: string, blockId: string) => {
    try {
      await removeBlockBookmarkApi(noteId, blockId);
      setBlocks(prev => prev.filter(b => b.blockId !== blockId));
    } catch (error) {
      console.error('Failed to remove block bookmark:', error);
      // alert('즐겨찾기 삭제에 실패했습니다.');
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="bookmark-empty">
        <BookDashed size={48} className="bookmark-empty-icon" />
        <span className="empty-text">아직 즐겨찾기한 지식이 없습니다!</span>
      </div>
    );
  }

  return (
    <ul className="block-bookmark-list">
      {blocks.map(block => (
        <BlockBookmarkItem
          key={block.blockId}
          block={block}
          onRemove={handleRemove}
        />
      ))}
    </ul>
  );
};

export default BlockBookmarkList;
