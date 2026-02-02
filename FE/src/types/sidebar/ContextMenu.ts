// src/types/sidebar/contextMenu.ts
export type ContextMenuState =
  | { visible: false }
  | {
      visible: true;
      x: number;
      y: number;
      type: 'NOTE';
      targetId: string;
      directoryPath: string;
    }
  | {
      visible: true;
      x: number;
      y: number;
      type: 'DIRECTORY';
      directoryPath: string;
    };
