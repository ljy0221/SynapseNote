import type { GetNotesResponse } from '../../types/note/GetNotes';
import type { NoteListItem } from '../../types/note/GetNotes';

export const adaptNotesForSidebar = (
  res: GetNotesResponse
): NoteListItem[] => {
  return res.content.map(note => ({
    noteId: note.noteId,
    userId: note.userId,
    title: note.title,
    directoryPath: note.directoryPath || '/',
    pointX: note.pointX ?? 0,
    pointY: note.pointY ?? 0,
    role: note.role,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));
};