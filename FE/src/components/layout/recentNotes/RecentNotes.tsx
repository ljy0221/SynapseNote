// src/components/home/recentNotes/RecentNotes.tsx
import React from 'react';
import './RecentNotes.css';

import type { NoteListItem } from '../../../types/note/getNotes';

interface RecentNotesProps {
  notes: NoteListItem[];
}

const RecentNotes: React.FC<RecentNotesProps> = ({ notes }) => {
  return (
    <section className="recent-notes">
      <h3 className="section-title">최근 작업한 노트</h3>

      <div className="note-list">
        {notes.slice(0, 3).map(note => (
          <div key={note.noteId} className="note-card">
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
