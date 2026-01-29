import type { DeleteNoteResponse } from '../../types/note/deleteNote';

export const adaptDeletedNoteId = (
  res: DeleteNoteResponse
): string => res.noteId;
