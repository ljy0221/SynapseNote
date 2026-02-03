// src/events/NotesEvents.ts
export const NOTES_CHANGED_EVENT = 'notes-changed';

export type NotesChangedDetail =
  | {
      skipRefetch?: boolean;
    }
  | {
      type: 'UPDATE_TITLE';
      noteId: string;
      title: string;
    };

export const emitNotesChanged = (detail?: NotesChangedDetail) => {
  window.dispatchEvent(
    new CustomEvent<NotesChangedDetail>(NOTES_CHANGED_EVENT, {
      detail,
    })
  );
};
