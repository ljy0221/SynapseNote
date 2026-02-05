// src/events/NotesEvents.ts
export const NOTES_CHANGED_EVENT = 'notes-changed';

export type NotesChangedDetail =
  | {
    skipRefetch?: boolean;
    source?: string;
  }
  | {
    type: 'UPDATE_TITLE';
    noteId: string;
    title: string;
    source?: string;
  }
  | {
    type: 'UPDATE_CONTENT';
    noteId: string;
    title: string;
    source?: string;
  }
  | {
    type: 'DELETE_NOTE';
    noteId: string;
    source?: string;
  };

export const emitNotesChanged = (detail?: NotesChangedDetail) => {
  window.dispatchEvent(
    new CustomEvent<NotesChangedDetail>(NOTES_CHANGED_EVENT, {
      detail,
    })
  );
};
