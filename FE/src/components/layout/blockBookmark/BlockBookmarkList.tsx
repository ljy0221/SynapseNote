// BlockBookmarkList.tsx
import { useState, useEffect } from 'react';
import BlockBookmarkItem from './BlockBookmarkItem';
import type { GetBookmarkBlocksResponse } from '../../../types/bookmark/BookmarkBlockResponse';
import { getBlockBookmarksApi } from '../../../api/bookmark/Bookmarks.api';

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

  const handleRemove = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.blockId !== blockId));
  };

  if (blocks.length === 0) {
    return (
      <div className="bookmark-empty">
        즐겨찾기한 블럭이 없습니다.
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
