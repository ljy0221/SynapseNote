// BlockBookmarkList.tsx
import { useState } from 'react';
import BlockBookmarkItem from './BlockBookmarkItem';
import type { BookmarkBlockItem } from '../../../types/bookmark/GetBookmarkBlocks';

const mockBlocks: BookmarkBlockItem[] = [
  {
    blockId: 'b1',
    blockType: 'TEXT',
    preview: '이진 탐색은 정렬된 배열에서...',
    noteId: 'n1',
    noteTitle: '이진 탐색',
    favoritedAt: '2026-01-26T10:00:00Z',
  },
  {
    blockId: 'b2',
    blockType: 'CODE',
    preview: 'function binarySearch(arr, target) { ... }',
    noteId: 'n1',
    noteTitle: '이진 탐색',
    favoritedAt: '2026-01-26T10:10:00Z',
  },
  {
    blockId: 'b3',
    blockType: 'CODE',
    preview: 'function binarySearch(arr, target) { ... }',
    noteId: 'n1',
    noteTitle: '이진 탐색',
    favoritedAt: '2026-01-26T10:10:00Z',
  },
  {
    blockId: 'b4',
    blockType: 'CODE',
    preview: 'function binarySearch(arr, target) { ... }',
    noteId: 'n1',
    noteTitle: '이진 탐색',
    favoritedAt: '2026-01-26T10:10:00Z',
  },
  {
    blockId: 'b5',
    blockType: 'TEXT',
    preview: '이진 탐색은 정렬된 배열에서...',
    noteId: 'n1',
    noteTitle: '이진 탐색',
    favoritedAt: '2026-01-26T10:00:00Z',
  },
];

const BlockBookmarkList = () => {
  const [blocks, setBlocks] = useState(mockBlocks);

  const handleRemove = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.blockId !== blockId));
    // TODO: API 연결 (optimistic UI)
  };

  if (blocks.length === 0) {
    return <div className="bookmark-empty">즐겨찾기한 블럭이 없습니다.</div>;
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
