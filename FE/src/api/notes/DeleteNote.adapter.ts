import type { DeleteNoteResponse } from '../../types/note/DeleteNote';

export const adaptDeletedNoteId = (
  res: DeleteNoteResponse
): string => res.noteId;
 