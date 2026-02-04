import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { BlockData, BlockType } from '../pages/note/Note';
import { useAuthStore } from '../store/useAuthStore';

// Yjs Map에서 사용하는 키 정의
type YBlockMap = Y.Map<any>;

/**
 * CRDT-safe 텍스트 diff 적용 함수
 * 전체 삭제/재삽입 대신 변경된 부분만 계산하여 Y.Text에 반영
 */
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
    // noteId 없으면 초기화
    if (!noteId) {
      setBlocks([]);
      setIsSynced(false);
      return;
    }

    console.log(`[Yjs] Connecting to ${wsUrl} for note: ${noteId}`);
    console.log(`[Yjs] Using accessToken? ${accessToken ? 'YES' : 'NO'}`);

    // ✅ 이전 provider/doc 정리 (중복 연결/리스너 누수 방지)
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (docRef.current) {
      docRef.current.destroy();
    }

    // ✅ 새 문서 생성
    const doc = new Y.Doc();
    docRef.current = doc;

    // ✅ Provider 생성 (token params 포함)
    const provider = new WebsocketProvider(wsUrl, noteId, doc, {
      params: { token: accessToken || '' },
    });
    providerRef.current = provider;

    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // 상태 초기화
    setBlocks([]);
    setIsSynced(false);

    const updateBlocksState = () => {
      const currentBlocks = yBlocks
        .toArray()
        .map((yBlock: YBlockMap) => {
          const properties = yBlock.get('properties') as Y.Map<any> | undefined;
          const type = yBlock.get('_class') as BlockType;

          if (!properties) return null;

          let content = '';
          let language: string | undefined = undefined;

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

    // ✅ 동기화 이벤트 (y-websocket은 'sync'가 일반적)
    const onSync = (synced: boolean) => {
      console.log('[Yjs] sync:', synced);
      setIsSynced(synced);
      if (synced) updateBlocksState();
    };
    provider.on('sync', onSync);

    // ✅ 블록 배열 변경 관찰 (실시간 반영 핵심)
    const onBlocksChanged = () => updateBlocksState();
    yBlocks.observe(onBlocksChanged);

    // (선택) 최초 연결 직후, 로컬에 이미 값이 있는 경우를 위해 한번 호출
    // synced 이후가 보장되긴 하지만, UX상 빠르게 반영하고 싶으면 유지
    updateBlocksState();

    return () => {
      console.log(`[Yjs] Disconnecting from ${noteId}...`);
      try {
        yBlocks.unobserve(onBlocksChanged);
      } catch {
        // observe 등록이 안 됐을 수도 있으니 무시
      }
      try {
        provider.off('sync', onSync);
      } catch {
        // off 미지원/에러 가능성 대비
      }
      provider.destroy();
      doc.destroy();
      providerRef.current = null;

      setBlocks([]);
      setIsSynced(false);
    };
  }, [noteId, wsUrl, accessToken]); // ✅ 토큰 변경(리프레시) 시 재연결

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
    if (!targetBlock) return;

    const properties = targetBlock.get('properties') as Y.Map<any>;
    const type = targetBlock.get('_class');

    doc.transact(() => {
      let yText: Y.Text | undefined;

      if (type === 'code') yText = properties.get('code') as Y.Text;
      else yText = properties.get('content') as Y.Text;

      if (!yText) return;

      const currentStr = yText.toString();
      if (currentStr !== newContent) {
        applyTextDiff(yText, currentStr, newContent);
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
      const nId = targetBlock.get('noteId');
      const type = targetBlock.get('_class');

      newBlockMap.set('blockId', blockId);
      newBlockMap.set('noteId', nId);
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