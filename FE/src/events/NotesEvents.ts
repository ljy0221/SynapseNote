export const NOTES_CHANGED_EVENT = 'notes:changed';

export const emitNotesChanged = (detail?: { skipRefetch?: boolean }) => {
  window.dispatchEvent(new CustomEvent(NOTES_CHANGED_EVENT, { detail }));
};
