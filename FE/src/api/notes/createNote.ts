import axios from 'axios';

export const createNote = async (payload: {
  title: string;
  directoryPath: string;
}) => {
  const res = await axios.post('/api/v1/notes', payload);
  return res.data;
};
