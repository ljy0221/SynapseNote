export interface SearchNoteItem {
  noteId: string;
  title: string;
  directoryPath: string;
  pointX: number;
  pointY: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchNotesResponse {
  notes: SearchNoteItem[];
}
