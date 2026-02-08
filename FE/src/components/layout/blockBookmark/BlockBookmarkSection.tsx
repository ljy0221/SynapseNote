// BlockBookmarkSection.tsx
import BlockBookmarkList from './BlockBookmarkList';
import { Blocks } from 'lucide-react';
import './BlockBookmark.css';

const BlockBookmarkSection = () => {
  return (
    <section className="bookmark-section block-bookmark-section">
      <div className="section-header">
        <h3 className="section-title">
          <Blocks size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Block Bookmarks
        </h3>

      </div>
      <div className="bookmark-content">
        <BlockBookmarkList />
      </div>
    </section>
  );
};

export default BlockBookmarkSection;
