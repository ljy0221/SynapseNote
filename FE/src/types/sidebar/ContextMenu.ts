import { NoteMemberRole } from "../note/GetNoteMembers";

export type ContextMenuState =
  | { visible: false }
  | {
    visible: true;
    x: number;
    y: number;
    type: 'NOTE';
    targetId: string;
    directoryPath: string;
    role?: NoteMemberRole; // [New]
  }
  | {
    visible: true;
    x: number;
    y: number;
    type: 'DIRECTORY';
    directoryPath: string;
  };
