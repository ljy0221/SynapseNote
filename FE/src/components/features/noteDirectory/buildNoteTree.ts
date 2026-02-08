import type { NoteListItem } from '../../../types/note/GetNotes';

export interface NoteTreeNode {
  name: string;
  path: string;
  children: NoteTreeNode[];
  notes: NoteListItem[];
}

const DEFAULT_DIR_NAME = '기본';
const DEFAULT_DIR_PATH = `/${DEFAULT_DIR_NAME}`;

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
    //  '/' 인 경우 가상 디렉토리로 치환 (UI 전용)
    const normalizedPath =
      note.directoryPath === '/'
        ? DEFAULT_DIR_PATH
        : note.directoryPath;

    const parts = normalizedPath
      .split('/')
      .filter(Boolean);

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

      //  마지막 디렉토리에 노트 추가
      if (index === parts.length - 1) {
        current.notes.push(note);
      }
    });
  }

  /**  재귀적으로 정렬 (자음/알파벳 순) */
  const sortTree = (node: NoteTreeNode) => {
    // 디렉토리 정렬
    node.children.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    // 노트 정렬 (최신 생성순)
    node.notes.sort((a, b) => b.createdAt - a.createdAt);

    // 자식들도 정렬
    node.children.forEach(sortTree);
  };

  sortTree(root);

  return root;
}
