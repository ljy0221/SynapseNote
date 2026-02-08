import { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
import { BlockData, BlockType } from '../types/note/Block';
import { useAuthStore } from '../store/useAuthStore';
import { env } from '../config/env';

// Type for awareness state
export interface AwarenessUser {
  memberId: string;
  memberName: string;
  profileImageUrl?: string;
  role?: string; // [New] User role for tooltip display
  focusedBlockId: string | null;
}

// Yjs Map에서 사용하는 키 정의
type YBlockMap = Y.Map<any>;

/**
 * CRDT-safe 텍스트 diff 적용 함수
 * 전체 삭제/재삽입 대신 변경된 부분만 계산하여 Y.Text에 반영
 */
export function applyTextDiff(yText: Y.Text, oldText: string, newText: string): void {
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
  const [isDataLoaded, setIsDataLoaded] = useState(false); // [New]
  const [isInitialized, setIsInitialized] = useState(false); // [New]
  const [editingUsers, setEditingUsers] = useState<Map<string, AwarenessUser>>(new Map()); // [New] Map of clientId to user info

  const docRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null); // [New]

  // [New] Simple tracking for delayed remote updates
  const focusedBlockIdRef = useRef<string | null>(null);
  const lastLocalUpdateRef = useRef<Map<string, number>>(new Map());

  // Zustand store에서 토큰 가져오기 (persist 복원 포함)
  const accessToken = useAuthStore((state) => state.accessToken);
  const userInfo = useAuthStore((state) => state.userInfo); // [New] Get user info for awareness



  // ... (rest of imports)

  // ...

  // 환경 변수에서 WS URL 가져오기
  const wsUrl = env.VITE_WS_URL || 'ws://localhost:1234';

  useEffect(() => {
    // noteId 없으면 초기화
    if (!noteId) {
      setBlocks([]);
      setIsSynced(false);
      setIsDataLoaded(false); // [New]
      return;
    }


    // 이전 provider/doc 정리 (중복 연결/리스너 누수 방지)
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (docRef.current) {
      docRef.current.destroy();
    }

    // 새 문서 생성
    const doc = new Y.Doc();
    docRef.current = doc;

    // WebSocket Provider 설정
    const provider = new WebsocketProvider(wsUrl, noteId, doc, {
      params: { token: accessToken || '' },
    });

    providerRef.current = provider;

    provider.on('sync', (isSynced: boolean) => {
      setIsSynced(isSynced);
    });


    // Awareness 설정
    const awareness = provider.awareness;
    awarenessRef.current = awareness;

    // [New] Set initial awareness state with user info
    if (userInfo) {
      awareness.setLocalStateField('user', {
        memberId: userInfo.memberId,
        memberName: userInfo.name || userInfo.email,
        profileImageUrl: undefined, // Not available in UserInfo, will be fetched from members list
        focusedBlockId: null,
      });
    }
    providerRef.current = provider;

    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // 상태 초기화
    setBlocks([]);
    setIsSynced(false);
    setIsDataLoaded(false); // [New]

    // React 상태 업데이트 디바운스 (빠른 Yjs 변경 루프 방지)
    let updateTimeout: NodeJS.Timeout | null = null;

    const updateBlocksState = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      updateTimeout = setTimeout(() => {
        const currentBlocks = yBlocks
          .toArray()
          .map((yBlock: YBlockMap) => {
            const properties = yBlock.get('properties') as Y.Map<any> | undefined;
            const type = yBlock.get('_class') as BlockType;

            if (!properties) return null;

            let content = '';
            let language: string | undefined = undefined;
            let rawHtml: string | undefined = undefined;
            const bookmark = properties.get('bookmark') || false;

            if (type === 'code') {
              const rawCode = properties.get('code');
              content = rawCode ? rawCode.toString() : ''; // Handles both Y.Text and string
              language = properties.get('language');
            } else {
              // [Fix] For text blocks, use rawHtml to preserve all formatting
              // rawHtml contains the latest HTML from TipTap editor
              const rawHtmlValue = properties.get('rawHtml');
              if (rawHtmlValue) {
                content = rawHtmlValue;
              } else {
                // Fallback to _initialHtml if rawHtml is not available
                const initialHtml = properties.get('_initialHtml');
                content = initialHtml || '';
              }
              // [New] Read rawHtml for preserving original HTML formatting
              rawHtml = properties.get('rawHtml');
            }

            return {
              id: yBlock.get('blockId'),
              type,
              content,
              language,
              bookmark,
              rawHtml,
            } as BlockData;
          })
          .filter(Boolean) as BlockData[];

        // [Fix] Deduplicate blocks by ID to prevent React key errors
        const seenIds = new Set();
        const uniqueBlocks = [];
        for (const block of currentBlocks) {
          if (seenIds.has(block.id)) {
            console.warn(`[Yjs] Duplicate block detected and ignored: ${block.id}`);
            continue;
          }
          seenIds.add(block.id);
          uniqueBlocks.push(block);
        }

        setBlocks(uniqueBlocks);
        setIsDataLoaded(true);

        // [New] Yjs 초기화 여부 체크
        const yMeta = docRef.current?.getMap<boolean>('meta');
        if (yMeta) {
          const initStatus = yMeta.get('isInitialized') || false;
          setIsInitialized(initStatus);
        }

        updateTimeout = null;
      }, 10); // 10ms debounce
    };

    // 동기화 이벤트 (y-websocket은 'sync'가 일반적)
    const onSync = (synced: boolean) => {
      setIsSynced(synced);
      if (synced) updateBlocksState();
    };
    provider.on('sync', onSync);

    // [New] Listen to awareness changes
    const onAwarenessChange = () => {
      const states = awareness.getStates();
      const users = new Map<string, AwarenessUser>();

      states.forEach((state, clientId) => {
        // Skip local client
        if (clientId === awareness.clientID) return;

        const user = state.user as AwarenessUser | undefined;
        if (user && user.focusedBlockId) {
          users.set(clientId.toString(), user);
        }
      });

      // [Optimization] Only update state if there are actual changes
      setEditingUsers(prevUsers => {
        // Check if the new map is different from the previous one
        if (prevUsers.size !== users.size) return users;

        let hasChanges = false;
        users.forEach((user, clientId) => {
          const prevUser = prevUsers.get(clientId);
          if (!prevUser ||
            prevUser.focusedBlockId !== user.focusedBlockId ||
            prevUser.memberId !== user.memberId) {
            hasChanges = true;
          }
        });

        return hasChanges ? users : prevUsers;
      });
    };

    awareness.on('change', onAwarenessChange);

    // 블록 배열 변경 관찰 (실시간 반영 핵심)
    // 🔥 Immediate CRDT merging for proper collaboration
    const onBlocksChanged = () => {
      // Always update state immediately for proper CRDT merging
      updateBlocksState();
    };
    yBlocks.observeDeep(onBlocksChanged);

    // (선택) 최초 연결 직후, 로컬에 이미 값이 있는 경우를 위해 한번 호출
    // synced 이후가 보장되긴 하지만, UX상 빠르게 반영하고 싶으면 유지
    updateBlocksState();

    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      try {
        yBlocks.unobserveDeep(onBlocksChanged);
      } catch {
        // observe 등록이 안 됐을 수도 있으니 무시
      }
      try {
        provider.off('sync', onSync);
      } catch {
        // off 미지원/에러 가능성 대비
      }
      try {
        awareness.off('change', onAwarenessChange);
      } catch {
        // off 미지원/에러 가능성 대비
      }

      // [Fix] Add delay to prevent disconnection during React Strict Mode remount
      setTimeout(() => {
        provider.destroy();
        doc.destroy();
        providerRef.current = null;
      }, 100);

      setBlocks([]);
      setIsSynced(false);
    };
  }, [noteId, wsUrl, accessToken]); // 토큰 변경(리프레시) 시 재연결

  // [New] 초기 데이터 주입 함수 (마커 설정 포함)
  const initializeYjs = useCallback((initialBlocks: { type: BlockType; content: string, bookmark?: boolean }[]) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');
    const yMeta = doc.getMap<boolean>('meta');

    doc.transact(() => {
      // 트랜잭션 내부에서 더블 체크 (경합 방지)
      if (yBlocks.length > 0 || yMeta.get('isInitialized')) {
        console.warn('[Yjs] Initialization skipped: Already initialized.');
        // 레거시 데이터 마이그레이션 (데이터는 있는데 마커는 없는 경우)
        if (yBlocks.length > 0 && !yMeta.get('isInitialized')) {
          yMeta.set('isInitialized', true);
        }
        return;
      }

      const mapsToInsert = initialBlocks.map(block => {
        const newBlockMap = new Y.Map();
        const newBlockId = crypto.randomUUID();

        newBlockMap.set('blockId', newBlockId);
        newBlockMap.set('noteId', noteId);
        newBlockMap.set('_class', block.type);

        const properties = new Y.Map();
        if (block.type === 'code') {
          // [New] Use Y.Text for code blocks to enable CRDT-based collaborative editing
          const yText = new Y.Text();
          if (block.content) {
            yText.insert(0, block.content);
          }
          properties.set('code', yText);
          properties.set('language', 'javascript');
          properties.set('version', '17');
          properties.set('executionMode', 'local');
        } else {
          properties.set('content', new Y.XmlFragment());
          // [New] Store initial HTML content temporarily for TipTap to parse
          if (block.content) {
            properties.set('_initialHtml', block.content);
            // [New] Store raw HTML permanently for formatted content (e.g., AI reviews)
            properties.set('rawHtml', block.content);
          }
        }
        properties.set('bookmark', block.bookmark || false);
        newBlockMap.set('properties', properties);
        return newBlockMap;
      });

      yBlocks.push(mapsToInsert);
      yMeta.set('isInitialized', true); // 마커 설정
      console.log('[Yjs] Initialized note with API data.');
    }, 'local');
  }, [noteId]);

  // 블록 추가
  const addBlock = useCallback((prevBlockId: number | string | null, type: BlockType, initialContent: string | undefined) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // 🔥 Transaction origin 'local' 추가
    doc.transact(() => {
      const newBlockMap = new Y.Map();
      const newBlockId = crypto.randomUUID();

      newBlockMap.set('blockId', newBlockId);
      newBlockMap.set('noteId', noteId);
      newBlockMap.set('_class', type);

      const properties = new Y.Map();
      if (type === 'code') {
        // [New] Use Y.Text for code blocks to enable CRDT-based collaborative editing
        const yText = new Y.Text();
        if (initialContent) {
          yText.insert(0, initialContent);
        }
        properties.set('code', yText);
        properties.set('language', 'javascript');
        properties.set('version', '17');
        properties.set('executionMode', 'local');
      } else {
        properties.set('content', new Y.XmlFragment());
        // [New] Store initial HTML content temporarily for TipTap to parse
        if (initialContent) {
          properties.set('_initialHtml', initialContent);
          // [New] Store raw HTML permanently for formatted content (e.g., AI reviews)
          properties.set('rawHtml', initialContent);
        }
      }
      properties.set('bookmark', false);
      newBlockMap.set('properties', properties);

      let insertIndex = yBlocks.length;
      if (prevBlockId) {
        // Find index from the current Yjs array to avoid depending on React state
        const currentYBlocks = yBlocks.toArray();
        const prevIndex = currentYBlocks.findIndex((b) => b.get('blockId') === prevBlockId);
        if (prevIndex !== -1) insertIndex = prevIndex + 1;
      }

      yBlocks.insert(insertIndex, [newBlockMap]);
    }, 'local');
  }, [noteId]); // Removed blocks dependency

  // 블록 업데이트
  const updateBlock = useCallback((blockId: number | string, newContent: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // Find the YBlock directly
    let targetBlock: YBlockMap | undefined;
    for (const block of yBlocks) {
      if (block.get('blockId') === blockId) {
        targetBlock = block;
        break;
      }
    }

    if (!targetBlock) return;

    const properties = targetBlock.get('properties') as Y.Map<any>;
    const type = targetBlock.get('_class');

    // 🔥 Transaction origin 'local' 추가: 로컬 변경임을 표시
    doc.transact(() => {
      if (type === 'code') {
        // [REMOVED] LWW Strategy for code blocks
        // Y.Text handles updates automatically via yCollab extension
        // No manual updates needed here
        return;
      }

      // [Fix] For text blocks, always save the HTML from TipTap to rawHtml
      // This ensures that formatting is preserved when saving to MongoDB
      if (type === 'text' && newContent) {
        properties.set('rawHtml', newContent);
        console.log(`[Yjs] Updated rawHtml for block ${blockId}, length: ${newContent.length}`);
      }

      const key = 'content';
      let yContent = properties.get(key) as any;

      // [Fix] Self-healing for corrupted data (if yContent is a string or missing methods)
      // For text blocks, we must use Y.XmlFragment for Tiptap.
      const isXmlFragment = yContent && (yContent instanceof Y.XmlFragment);

      if (yContent && !isXmlFragment && typeof yContent.insert !== 'function') {
        console.warn(`[Yjs] Corrupted content detected for block ${blockId}. Repairing...`);
        const strContent = yContent.toString();
        // Return to Y.XmlFragment
        const newFragment = new Y.XmlFragment();
        const paragraph = new Y.XmlElement('paragraph');
        const textNode = new Y.XmlText(strContent);
        paragraph.insert(0, [textNode]);
        newFragment.insert(0, [paragraph]);
        properties.set(key, newFragment);
        yContent = newFragment;
      }

      if (!yContent) return;

      const currentStr = yContent.toString();
      if (currentStr !== newContent) {
        // [Note] Manual update for XmlFragment via diffing is complex.
        // For TextBlocks using Collaboration extension, this updateBlock call
        // might be redundant or only used for initial/external data sync.
        // If it's a TextBlock, we rely on the editor/extension.
        if (type !== 'text') {
          applyTextDiff(yContent, currentStr, newContent);
        }
      }
    }, 'local'); // ← 로컬 변경 마커
  }, []);

  // 블록 언어 업데이트
  const updateBlockLanguage = useCallback((blockId: number | string, newLanguage: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // Find the YBlock directly
    let targetBlock: YBlockMap | undefined;
    for (const block of yBlocks) {
      if (block.get('blockId') === blockId) {
        targetBlock = block;
        break;
      }
    }

    if (!targetBlock) return;

    const properties = targetBlock.get('properties') as Y.Map<any>;
    const type = targetBlock.get('_class');

    if (type !== 'code') return;

    // 🔥 Transaction origin 'local' 추가
    doc.transact(() => {
      properties.set('language', newLanguage);
    }, 'local');
  }, []);

  // 블록 삭제
  const deleteBlock = useCallback((blockId: number | string) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // 🔥 Transaction origin 'local' 추가
    doc.transact(() => {
      // Remove reliance on 'blocks' state index
      let targetIndex = -1;
      let i = 0;
      for (const block of yBlocks) {
        if (block.get('blockId') === blockId) {
          targetIndex = i;
          break;
        }
        i++;
      }

      if (targetIndex !== -1) {
        yBlocks.delete(targetIndex, 1);
        console.log(`[Yjs] Block deleted locally: ${blockId}`);
      } else {
        // Fallback or log if needed
        console.warn('[Yjs] Block to delete not found in YDoc:', blockId);
      }
    }, 'local');
  }, []);

  // 블록 이동
  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    if (fromIndex === toIndex) return;

    // 🔥 Transaction origin 'local' 추가
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
          if (key === 'content') {
            const fragment = new Y.XmlFragment();
            // If we have content, try to preserve it as plain text/XML string.
            // Tiptap will re-parse it in the new block.
            if (value && typeof value.toString === 'function') {
              const str = value.toString();
              if (str) {
                // [Fix] Initialize as plain string/value from DB.
                // Clients will handle migration to specific Yjs types (e.g. Text -> XmlFragment).
                // This avoids redundant wrapping and technical tags leaking into DB incorrectly.
                // For moveBlock, we want to preserve the content as-is, and let the migration logic
                // in getYTextForBlock handle the conversion to XmlFragment if needed.
                // So, we set it as a plain string here.
                newProperties.set(key, str);
              } else {
                newProperties.set(key, fragment); // Empty fragment if no content
              }
            } else {
              newProperties.set(key, fragment); // If value is not a string or has no toString, use empty fragment
            }
          } else if (key === 'code' && value !== undefined) {
            newProperties.set(key, value.toString());
          } else {
            // Primitive or simple object
            newProperties.set(key, value);
          }
        });
      }
      newProperties.set('bookmark', oldProperties.get('bookmark') || false); // Ensure bookmark is preserved properly

      newBlockMap.set('properties', newProperties);

      if (fromIndex < toIndex) {
        yBlocks.insert(toIndex + 1, [newBlockMap]);
        yBlocks.delete(fromIndex, 1);
      } else {
        yBlocks.insert(toIndex, [newBlockMap]);
        yBlocks.delete(fromIndex + 1, 1);
      }
    }, 'local');
  }, []);

  // 여러 블록 한꺼번에 추가 (batch)
  const addBlocksBatch = useCallback((blocksToInsert: { type: BlockType; content: string, bookmark?: boolean }[]) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    // 🔥 Transaction origin 'local' 추가
    doc.transact(() => {
      const mapsToInsert = blocksToInsert.map(block => {
        const newBlockMap = new Y.Map();
        const newBlockId = crypto.randomUUID();

        newBlockMap.set('blockId', newBlockId);
        newBlockMap.set('noteId', noteId);
        newBlockMap.set('_class', block.type);

        const properties = new Y.Map();
        if (block.type === 'code') {
          // [New] Use Y.Text for code blocks to enable CRDT-based collaborative editing
          const yText = new Y.Text();
          if (block.content) {
            yText.insert(0, block.content);
          }
          properties.set('code', yText);
          properties.set('language', 'javascript');
          properties.set('version', '17');
          properties.set('executionMode', 'local');
        } else {
          properties.set('content', new Y.XmlFragment());
          // [New] Store initial HTML content temporarily for TipTap to parse
          if (block.content) {
            properties.set('_initialHtml', block.content);
            // [New] Store raw HTML permanently for formatted content (e.g., AI reviews)
            properties.set('rawHtml', block.content);
          }
        }
        properties.set('bookmark', block.bookmark || false);
        newBlockMap.set('properties', properties);
        return newBlockMap;
      });

      yBlocks.push(mapsToInsert);
    }, 'local');
  }, [noteId]);

  // [Fix] React State debounce로 인한 초기화 경합 방지를 위해 동기적으로 상태 체크 후 초기화
  // [New] Migrate text blocks to Y.XmlFragment if needed (one-time migration)
  const migrateBlocksToXmlFragment = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');

    doc.transact(() => {
      yBlocks.forEach((block, idx) => {
        const type = block.get('_class');
        if (type !== 'text') return; // Only migrate text blocks

        const properties = block.get('properties') as Y.Map<any>;
        const key = 'content';
        let fragment = properties.get(key);

        // Check if migration needed (use instanceof instead of constructor.name which breaks in minified builds)
        const isSharedType = !!(fragment && typeof (fragment as any).observe === 'function');
        const hasToArray = !!(fragment && typeof (fragment as any).toArray === 'function');
        const isXmlFragment = !!(fragment && fragment instanceof Y.XmlFragment);

        const needsMigration = !fragment || !isSharedType || !hasToArray || !isXmlFragment;

        if (needsMigration) {
          console.warn(`[Yjs] Migrating block ${idx} to Y.XmlFragment (empty). Tiptap will initialize it.`);

          // [Fix] Create empty Y.XmlFragment and let Tiptap initialize it with the content.
          // Don't manually create the structure as it might not match Tiptap's schema.
          const newFragment = new Y.XmlFragment();
          properties.set(key, newFragment);
          fragment = newFragment;
        }

        // [Fix] Check if XmlFragment contains malformed content (text with invalid HTML tags)
        // This happens when content like "<bold>text</bold>" was stored as plain text
        if (fragment && isXmlFragment) {
          // [Fix] Disable aggressive malformed check. It seems to be deleting valid content or content that Tiptap can handle.
          // The previous regex was /<bold>|<\/bold>|<italic>|<\/italic>|<underline>|<\/underline>/i
          // If Tiptap produces these or if they are harmless, we shouldn't wipe the block.
          /*
          const xmlString = (fragment as any).toString();
          const hasMalformedTags = /<bold>|<\/bold>|<italic>|<\/italic>|<underline>|<\/underline>/i.test(xmlString);

          if (hasMalformedTags) {
            console.warn(`[Yjs] Detected malformed XmlFragment in block ${idx} - has invalid tags like <bold>`);

            // Clear the malformed fragment
            const children = (fragment as any).toArray();
            if (children.length > 0) {
              (fragment as any).delete(0, children.length);
            }

            // Convert TipTap schema tags to proper HTML for re-parsing
            const htmlContent = xmlString
              .replace(/<paragraph>/g, '<p>')
              .replace(/<\/paragraph>/g, '</p>')
              .replace(/<bold>/g, '<strong>')
              .replace(/<\/bold>/g, '</strong>')
              .replace(/<italic>/g, '<em>')
              .replace(/<\/italic>/g, '</em>')
              .replace(/<underline>/g, '<u>')
              .replace(/<\/underline>/g, '</u>');

            properties.set('_initialHtml', htmlContent);
            console.log(`[Yjs] Stored malformed content as _initialHtml for re-parsing`);
          }
          */
        }
      });
    }, 'local');

    console.log('[Yjs] Block migration to XmlFragment completed.');
  }, []);

  const checkAndInitialize = useCallback((initialBlocks: { type: BlockType; content: string, bookmark?: boolean }[]) => {
    const doc = docRef.current;
    if (!doc) return;
    const yBlocks = doc.getArray<YBlockMap>('blocks');
    const yMeta = doc.getMap<boolean>('meta');

    // 동기적으로 실제 Yjs 데이터 확인 (트랜잭션 없이 읽기만)
    if (yBlocks.length > 0 || yMeta.get('isInitialized')) {
      console.log('[Yjs] checkAndInitialize: Already initialized, skipping.');
      // [New] Run migration for existing data
      migrateBlocksToXmlFragment();
      return;
    }

    // 초기화 진행
    initializeYjs(initialBlocks);
  }, [initializeYjs, migrateBlocksToXmlFragment]);

  // [New] Update focused block in awareness
  const setFocusedBlock = useCallback((blockId: string | null) => {
    const previousId = focusedBlockIdRef.current;

    // [New] On blur: clear timestamp so remote updates can come through
    if (previousId && previousId !== blockId) {
      lastLocalUpdateRef.current.delete(previousId);
      console.log(`[Yjs] Blur from block ${previousId} - clearing timestamp`);
    }

    // Update focused block ref
    focusedBlockIdRef.current = blockId;

    const awareness = awarenessRef.current;
    if (!awareness || !userInfo) return;

    const currentState = awareness.getLocalState();
    awareness.setLocalStateField('user', {
      ...currentState?.user,
      memberId: userInfo.memberId,
      memberName: userInfo.name || userInfo.email,
      profileImageUrl: undefined, // Not available in UserInfo
      focusedBlockId: blockId,
    });
  }, [userInfo]);

  // [New] Get users editing a specific block
  const getBlockEditors = useCallback((blockId: string): AwarenessUser[] => {
    const editors: AwarenessUser[] = [];
    editingUsers.forEach((user) => {
      if (user.focusedBlockId === blockId) {
        editors.push(user);
      }
    });
    return editors;
  }, [editingUsers]);


  return {
    blocks,
    isSynced,
    isDataLoaded,
    isInitialized, // [New]
    initializeYjs, // [New]
    checkAndInitialize, // [New]
    addBlock,
    addBlocksBatch,
    updateBlock,
    updateBlockLanguage,
    deleteBlock,
    moveBlock,
    setFocusedBlock, // [New]
    getBlockEditors, // [New]
    editingUsers, // [New]
    // [New] Expose Y.Doc and Y.Text for Tiptap Collaboration
    getYDoc: () => docRef.current,
    getYTextForBlock: (blockId: string | number) => {
      const doc = docRef.current;
      if (!doc) {
        return null;
      }

      const yBlocks = doc.getArray<YBlockMap>('blocks');
      const allBlocks = yBlocks.toArray();

      const targetBlock = allBlocks.find(block => {
        const id = block.get('blockId');
        return id?.toString() === blockId.toString();
      });

      if (!targetBlock) {
        return null;
      }

      const properties = targetBlock.get('properties') as Y.Map<any>;
      const type = targetBlock.get('_class');

      // Code blocks use plain string (LWW), so getYTextForBlock returns null
      if (type === 'code') {
        return null;
      }

      const key = 'content';
      let fragment = properties.get(key);

      // Check if it's actually an XmlFragment (use instanceof instead of constructor.name which breaks in minified builds)
      const isXmlFragment = fragment && fragment instanceof Y.XmlFragment;

      // [New] Auto-migrate: Create XmlFragment if it doesn't exist or is wrong type
      if (!isXmlFragment) {
        doc.transact(() => {
          const newFragment = new Y.XmlFragment();
          properties.set(key, newFragment);
          fragment = newFragment;
        }, 'local');
      }

      return fragment as Y.XmlFragment;
    },

    // [New] Get Y.Text for CodeBlock - similar to getYTextForBlock but for code
    getYTextForCodeBlock: (blockId: string | number): Y.Text | null => {
      const doc = docRef.current;
      if (!doc) {
        console.warn('[getYTextForCodeBlock] No Yjs document available');
        return null;
      }

      const yBlocks = doc.getArray<YBlockMap>('blocks');
      let yBlock: YBlockMap | undefined;

      // Find block by ID - use 'blockId' key to match how blocks are stored
      for (const block of yBlocks) {
        const bid = block.get('blockId'); // [FIX] Changed from 'id' to 'blockId'
        if (bid === blockId || String(bid) === String(blockId)) {
          yBlock = block;
          break;
        }
      }

      if (!yBlock) {
        console.warn(`[getYTextForCodeBlock] Block ${blockId} not found`);
        return null;
      }

      const properties = yBlock.get('properties');
      if (!(properties instanceof Y.Map)) {
        console.warn(`[getYTextForCodeBlock] Block ${blockId} has no properties map`);
        return null;
      }

      let yText = properties.get('code');

      // Feature-based detection for Y.Text
      const isSharedType = yText && typeof yText === 'object';
      const hasInsert = isSharedType && typeof (yText as any).insert === 'function';
      const hasDelete = isSharedType && typeof (yText as any).delete === 'function';
      const hasToString = isSharedType && typeof (yText as any).toString === 'function';
      const isYText = hasInsert && hasDelete && hasToString;

      const needsMigration = !yText || !isYText;

      if (needsMigration) {
        const initialCode = typeof yText === 'string' ? yText : '';
        console.warn(`[Yjs] Migrating CodeBlock ${blockId} to Y.Text. Code length: ${initialCode.length}`);

        doc.transact(() => {
          const newYText = new Y.Text();

          if (initialCode) {
            newYText.insert(0, initialCode);
          }

          properties.set('code', newYText);
          yText = newYText;
        }, 'local');
      }

      console.log(`[getYTextForCodeBlock] Result for ${blockId}:`, {
        type: yText?.constructor?.name,
        hasInsert: typeof (yText as any)?.insert === 'function',
        length: (yText as Y.Text)?.length
      });

      return yText as Y.Text | null;
    },
  };
};