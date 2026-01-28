import axios from 'axios';
import type { GetNotesResponse, NoteListItem } from '../../types/note/getNotes';

export const getNotes = async (): Promise<NoteListItem[]> => {
  const res = await axios.get<GetNotesResponse>('/api/v1/notes');
  return res.data.notes; // 🔥 pagination은 Sidebar에서 안 씀
};
