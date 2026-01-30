import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentNotes.css';

import type { NoteListItem } from '../../../types/note/GetNotes';

interface RecentNotesProps {
  notes: NoteListItem[];
}

const RecentNotes: React.FC<RecentNotesProps> = ({ notes }) => {
  const navigate = useNavigate();

  const handleClickNote = (noteId: string) => {
    console.log('[RecentNotes] 노트 이동', { noteId });
    navigate(`/notes/${noteId}`);
  };

  return (
    <section className="recent-notes">
      <h3 className="section-title">최근 작업한 노트</h3>

      <div className="note-list">
        {notes.slice(0, 3).map(note => (
          <div
            key={note.noteId}
            className="note-card"
            onClick={() => handleClickNote(note.noteId)}
            role="button"
            tabIndex={0}
          >
            <h4 className="note-title">{note.title}</h4>

            <span className="note-path">
              {note.directoryPath}
            </span>

            <span className="note-date">
              마지막 수정:{' '}
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentNotes;
