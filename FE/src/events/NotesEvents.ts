export const NOTES_CHANGED_EVENT = 'notes:changed';

export const emitNotesChanged = () => {
  window.dispatchEvent(new Event(NOTES_CHANGED_EVENT));
};
