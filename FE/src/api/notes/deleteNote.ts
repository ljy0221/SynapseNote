import axios from 'axios';

export const deleteNote = async (noteId: string): Promise<void> => {
  await axios.delete(`/api/v1/notes/${noteId}`);
};
