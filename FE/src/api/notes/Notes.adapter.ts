import type { GetNotesResponse } from '../../types/note/GetNotes';
import type { NoteListItem } from '../../types/note/GetNotes';
import dayjs from 'dayjs';

export const adaptNotesForSidebar = (res: GetNotesResponse): NoteListItem[] => {

  return res.content.map(note => ({
    noteId: note.noteId,
    memberId: note.memberId,
    title: note.title,
    directoryPath: note.directoryPath || '/',
    pointX: note.pointX ?? 0,
    pointY: note.pointY ?? 0,
    role: note.role,
    createdAt: dayjs(note.createdAt).valueOf(),
    updatedAt: dayjs(note.updatedAt).valueOf(),

  }));
};