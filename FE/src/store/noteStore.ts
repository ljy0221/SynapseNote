// store/noteStore.ts
import { create } from 'zustand';
import * as Y from 'yjs'; // npm install yjs
import { generateBlockId } from '../utils/id';

// 블록 데이터 인터페이스 정의
export interface Block {
  id: string;
  type: string;
  content: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

// 스토어 State 및 Action 인터페이스
interface NoteState {
  yblocks: Y.Map<Block>; // Y.js Map 객체 (Block 타입을 값으로 가짐)
  blocks: Block[];       // UI 렌더링용 로컬 배열
  addBlock: (type?: string, parentId?: string | null) => string;
//   splitBlock: (currentBlockId: string, cursorPosition: number) => string;
  sortBlocksByCreation: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  // 초기 상태 (실제 앱에서는 Y.Doc 인스턴스에서 가져오거나 주입받아야 함)
  yblocks: new Y.Map<Block>(),
  blocks: [],

  addBlock: (type = 'paragraph', parentId = null) => {
    const blockId = generateBlockId(); // UUID v7 사용

    const newBlock: Block = {
      id: blockId,
      type,
      content: '',
      parentId,
      createdAt: Date.now(), // 명시적 timestamp 유지
      updatedAt: Date.now(),
    };

    const { yblocks } = get();
    yblocks.set(blockId, newBlock);

    return blockId;
  },

  // Enter로 블록 분할
//   splitBlock: (currentBlockId: string, cursorPosition: number) => {
//     const newBlockId = generateBlockId(); // UUID v7

//     const { yblocks, blocks } = get();
//     const currentBlock = blocks.find((b) => b.id === currentBlockId);

//     // TypeScript Safety: 찾는 블록이 없을 경우 에러 방지
//     if (!currentBlock) {
//       console.error(`Block not found: ${currentBlockId}`);
//       return newBlockId;
//     }

//     const beforeCursor = currentBlock.content.substring(0, cursorPosition);
//     const afterCursor = currentBlock.content.substring(cursorPosition);

//     // yblocks.doc이 존재하는지 확인 후 트랜잭션 실행
//     yblocks.doc?.transact(() => {
//       // 1. 기존 블록 업데이트 (커서 앞부분)
//       yblocks.set(currentBlockId, {
//         ...currentBlock,
//         content: beforeCursor,
//         updatedAt: Date.now(),
//       });

//       // 2. 새 블록 생성 (커서 뒷부분)
//       yblocks.set(newBlockId, {
//         id: newBlockId,
//         type: currentBlock.type,
//         content: afterCursor,
//         parentId: currentBlock.parentId,
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//       });
//     });

//     return newBlockId;
//   },

  // 블록들을 ID 기준으로 시간순 정렬
  sortBlocksByCreation: () => {
    const { blocks } = get();

    // UUID v7이므로 문자열 비교만으로 시간순 정렬 가능
    const sorted = [...blocks].sort((a, b) => 
      a.id.localeCompare(b.id)
    );

    set({ blocks: sorted });
  },
}));