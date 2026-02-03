import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StickyNote, Clock, Hexagon, Route } from 'lucide-react';
import './RecentNotes.css';

import type { NoteListItem } from '../../../types/note/GetNotes';

interface RecentNotesProps {
  notes: NoteListItem[];
}

const RecentNotes: React.FC<RecentNotesProps> = ({ notes }) => {
  const navigate = useNavigate();

  const handleClickNote = (noteId: string) => {
    console.log('[RecentNotes] 노트 이동', { noteId });
    navigate(`/note/${noteId}`);
  };

  // 6개 슬롯 렌더링 (Array.from 사용)

  return (
    <section className="recent-notes">
      <div className="section-header">
        <h3 className="section-title">
          <Clock size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          최근 작업한 노트
        </h3>

      </div>

      <div className="recent-notes-content">
        <div className="note-list">
          {Array.from({ length: 6 }).map((_, index) => {
            const note = notes[index];
            return note ? (
              <div
                key={note.noteId}
                className="note-card populated"
                onClick={() => handleClickNote(note.noteId)}
                role="button"
                tabIndex={0}
              >
                <h4 className="note-title">
                  <Hexagon size={14} className="note-icon" />
                  {note.title}
                </h4>

                <span className="note-path">
                  <Route size={12} className="path-icon" style={{ marginRight: '4px' }} />
                  {note.directoryPath}
                </span>

                <span className="note-date">
                  마지막 수정:{' '}
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <div key={`placeholder-${index}`} className="note-card placeholder">
                <StickyNote className="placeholder-icon" size={24} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default RecentNotes;
