// BlockBookmarkList.tsx
import { useState } from 'react';
import BlockBookmarkItem from './BlockBookmarkItem';
import type { GetBookmarkBlocksResponse } from '../../../types/bookmark/BookmarkBlockResponse';

const BlockBookmarkList = () => {
  const [blocks, setBlocks] = useState<GetBookmarkBlocksResponse['content']>([]);

  const handleRemove = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.blockId !== blockId));
    // TODO: API 연결 (optimistic UI)
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
