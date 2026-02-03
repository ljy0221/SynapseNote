import NoteBookmarkList from './NoteBookmarkList';
import { Bookmark } from 'lucide-react';
import './NoteBookmark.css';

const NoteBookmarkSection = () => {
  return (
    <section className="bookmark-section note-bookmark-section">
      <div className="section-header">
        <h3 className="section-title">
          <Bookmark size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Note Bookmarks
        </h3>
        <div className="window-controls">
          <div className="control-dot red" />
          <div className="control-dot yellow" />
          <div className="control-dot green" />
        </div>
      </div>
      <div className="bookmark-content">
        <NoteBookmarkList />
      </div>
    </section>
  );
};

export default NoteBookmarkSection;
