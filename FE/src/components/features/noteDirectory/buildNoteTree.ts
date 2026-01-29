import type { NoteListItem } from '../../../types/note/GetNotes';

export interface NoteTreeNode {
  name: string;
  path: string;
  children: NoteTreeNode[];
  notes: NoteListItem[];
}

export function buildNoteTree(
  notes: NoteListItem[] = []
): NoteTreeNode {
  const root: NoteTreeNode = {
    name: 'root',
    path: '/',
    children: [],
    notes: [],
  };

  for (const note of notes) {
    const parts = note.directoryPath
      .split('/')
      .filter(Boolean); // ['', '알고리즘', '탐색'] → ['알고리즘', '탐색']

    let current = root;

    parts.forEach((part, index) => {
      const nextPath =
        current.path === '/'
          ? `/${part}`
          : `${current.path}/${part}`;

      let child = current.children.find(c => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: nextPath,
          children: [],
          notes: [],
        };
        current.children.push(child);
      }

      current = child;

      // 마지막 디렉토리에 노트 추가
      if (index === parts.length - 1) {
        current.notes.push(note);
      }
    });
  }

  return root;
}
