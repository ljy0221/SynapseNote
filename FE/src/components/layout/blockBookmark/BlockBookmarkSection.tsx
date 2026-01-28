// BlockBookmarkSection.tsx
import BlockBookmarkList from './BlockBookmarkList';
import './BlockBookmark.css';

const BlockBookmarkSection = () => {
  return (
    <section className="bookmark-section">
      <h2 className="bookmark-section-title">Block</h2>
      <BlockBookmarkList />
    </section>
  );
};

export default BlockBookmarkSection;
