import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { BlockData, BlockType } from '../pages/note/Note';
import { useAuthStore } from '../store/useAuthStore'; // ✅ 추가

// Yjs Map에서 사용하는 키 정의
type YBlockMap = Y.Map<any>;

function applyTextDiff(yText: Y.Text, oldText: string, newText: string): void {
  let prefixLen = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const deleteFrom = prefixLen;
  const deleteLen = oldText.length - prefixLen - suffixLen;
  const insertText = newText.substring(prefixLen, newText.length - suffixLen);

  if (deleteLen > 0) yText.delete(deleteFrom, deleteLen);
  if (insertText.length > 0) yText.insert(deleteFrom, insertText);
}

export const useYjsStore = (noteId: string | undefined) => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const docRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebsocketProvider | null>(null);

  // ✅ Zustand store에서 토큰 가져오기 (persist 복원 포함)
  const accessToken = useAuthStore((state) => state.accessToken);

  // 환경 변수에서 WS URL 가져오기
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';

  useEffect(() => {
    if (!noteId) {
      setBlocks([]);
      return;
    }

    console.log(`[Yjs] Connecting to ${wsUrl} for note: ${noteId}`);
    console.log(`[Yjs] Using accessToken? ${accessToken ? 'YES' : 'NO'}`);

    // 이전 provider 정리(안전)
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }

    // 새로운 문서 생성 (이전 문서 폐기)
    if (docRef.current) {
      docRef.current.destroy();
    }
    docRef.current = new Y.Doc();

    // ✅ Provider 설정: token을 params에 포함 (store 토큰 사용)
    const provider = new WebsocketProvider(wsUrl, noteId, docRef.current, {
      params: { token: accessToken || '' },
    });
    providerRef.current = provider;

    const yBlocks = docRef.current.getArray<YBlockMap>('blocks');

    // 상태 초기화 (중복 방지)
    setBlocks([]);
    setIsSynced(false);

    const updateBlocksState = () => {
      const currentBlocks = yBlocks
        .toArray()
        .map((yBlock: YBlockMap) => {
          const properties = yBlock.get('properties') as Y.Map<any>;
          const type = yBlock.get('_class') as BlockType;

          if (!properties) return null;

          let content = '';
          let language = undefined;

          if (type === 'code') {
            const codeText = properties.get('code');
            content = codeText ? codeText.toString() : '';
            language = properties.get('language');
          } else {
            const contentText = properties.get('content');
            content = contentText ? contentText.toString() : '';
          }

          return {
            id: yBlock.get('blockId'),
            type,
            content,
            language,
          } as BlockData;
        })
        .filter(Boolean) as BlockData[];

      setBlocks(currentBlocks);
    };

    // 초기 동기화 관찰
    provider.on('sync', (isSynced: boolean) => {
        console.log('[Yjs] sync:', isSynced);
        setIsSynced(isSynced);
        if (isSynced) updateBlocksState();
    });
    
    // 데이터 변경 관찰
    yBlocks.observe(() => {
      updateBlocksState();
    });

    return () => {
      console.log(`[Yjs] Disconnecting from ${noteId}...`);
      provider.destroy();
      docRef.current.destroy();
      setBlocks([]);
    };
    // ✅ 토큰이 바뀌면(리프레시 포함) WS도 다시 연결되게 의존성에 추가
  }, [noteId, wsUrl, accessToken]);

  // 블록 추가
  const addBlock = (prevBlockId: number | string | null, type: BlockType) => {
    const doc = docRef.current;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    doc.transact(() => {
      const newBlockMap = new Y.Map();
      const newBlockId = crypto.randomUUID();

      newBlockMap.set('blockId', newBlockId);
      newBlockMap.set('noteId', noteId);
      newBlockMap.set('_class', type);

      const properties = new Y.Map();
      if (type === 'code') {
        properties.set('code', new Y.Text(''));
        properties.set('language', 'javascript');
        properties.set('version', '17');
        properties.set('executionMode', 'local');
      } else {
        properties.set('content', new Y.Text(''));
      }
      newBlockMap.set('properties', properties);

      let insertIndex = yBlocks.length;
      if (prevBlockId) {
        const prevIndex = blocks.findIndex((b) => b.id === prevBlockId);
        if (prevIndex !== -1) insertIndex = prevIndex + 1;
      }

      yBlocks.insert(insertIndex, [newBlockMap]);
    });
  };

  // 블록 업데이트
  const updateBlock = (blockId: number | string, newContent: string) => {
    const doc = docRef.current;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const targetBlock = yBlocks.get(index);
    const properties = targetBlock.get('properties') as Y.Map<any>;
    const type = targetBlock.get('_class');

    doc.transact(() => {
      let yText: Y.Text | undefined;

      if (type === 'code') yText = properties.get('code') as Y.Text;
      else yText = properties.get('content') as Y.Text;

      if (yText) {
        const currentStr = yText.toString();
        if (currentStr !== newContent) applyTextDiff(yText, currentStr, newContent);
      }
    });
  };

  // 블록 삭제
  const deleteBlock = (blockId: number | string) => {
    const doc = docRef.current;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    const index = blocks.findIndex((b) => b.id === blockId);
    if (index !== -1) yBlocks.delete(index, 1);
  };

  // 블록 이동
  const moveBlock = (fromIndex: number, toIndex: number) => {
    const doc = docRef.current;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    if (fromIndex === toIndex) return;

    doc.transact(() => {
      const targetBlock = yBlocks.get(fromIndex);
      if (!targetBlock) return;

      const newBlockMap = new Y.Map();

      const blockId = targetBlock.get('blockId');
      const noteId = targetBlock.get('noteId');
      const type = targetBlock.get('_class');

      newBlockMap.set('blockId', blockId);
      newBlockMap.set('noteId', noteId);
      newBlockMap.set('_class', type);

      const oldProperties = targetBlock.get('properties') as Y.Map<any>;
      const newProperties = new Y.Map();

      if (oldProperties) {
        oldProperties.forEach((value, key) => {
          if (value instanceof Y.Text) newProperties.set(key, new Y.Text(value.toString()));
          else newProperties.set(key, value);
        });
      }
      newBlockMap.set('properties', newProperties);

      if (fromIndex < toIndex) {
        yBlocks.insert(toIndex + 1, [newBlockMap]);
        yBlocks.delete(fromIndex, 1);
      } else {
        yBlocks.insert(toIndex, [newBlockMap]);
        yBlocks.delete(fromIndex + 1, 1);
      }
    });
  };

  return {
    blocks,
    isSynced,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
  };
};