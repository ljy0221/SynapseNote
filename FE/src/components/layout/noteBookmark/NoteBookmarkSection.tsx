import NoteBookmarkList from './NoteBookmarkList';
import './NoteBookmark.css';

const NoteBookmarkSection = () => {
  return (
    <section className="bookmark-section">
      <h2 className="section-title">Note</h2>
      <NoteBookmarkList />
    </section>
  );
};

export default NoteBookmarkSection;
