import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { BlockData, BlockType } from '../pages/note/Note';

// Yjs Map에서 사용하는 키 정의
type YBlockMap = Y.Map<any>;

/**
 * CRDT-safe 텍스트 diff 적용 함수
 * 전체 삭제/재삽입 대신 변경된 부분만 계산하여 Y.Text에 반영
 * 이를 통해 다중 사용자 동시 편집 시 충돌을 방지합니다.
 * 
 * @param yText - Yjs Y.Text 객체
 * @param oldText - 현재 텍스트
 * @param newText - 새로운 텍스트
 */
function applyTextDiff(yText: Y.Text, oldText: string, newText: string): void {
    // 1. 앞에서부터 공통 접두사 길이 찾기
    let prefixLen = 0;
    const minLen = Math.min(oldText.length, newText.length);
    while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
        prefixLen++;
    }

    // 2. 뒤에서부터 공통 접미사 길이 찾기
    let suffixLen = 0;
    while (
        suffixLen < minLen - prefixLen &&
        oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
    ) {
        suffixLen++;
    }

    // 3. 변경된 구간 계산
    const deleteFrom = prefixLen;
    const deleteLen = oldText.length - prefixLen - suffixLen;
    const insertText = newText.substring(prefixLen, newText.length - suffixLen);

    // 4. Y.Text에 변경 적용 (삭제 후 삽입)
    if (deleteLen > 0) {
        yText.delete(deleteFrom, deleteLen);
    }
    if (insertText.length > 0) {
        yText.insert(deleteFrom, insertText);
    }
}

export const useYjsStore = (noteId: string | undefined) => {
    const [blocks, setBlocks] = useState<BlockData[]>([]);
    const [isSynced, setIsSynced] = useState(false);
    const docRef = useRef<Y.Doc>(new Y.Doc());
    const providerRef = useRef<WebsocketProvider | null>(null);

    // 환경 변수에서 WS URL 가져오기
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';

    useEffect(() => {
        if (!noteId) {
            setBlocks([]);
            return;
        }

        // 로컬 스토리지에서 토큰 가져오기 (useAuthStore 참고)
        const token = localStorage.getItem('authToken');

        console.log(`[Yjs] Connecting to ${wsUrl} for note: ${noteId}`);

        // 새로운 문서 생성 (이전 문서 폐기)
        if (docRef.current) {
            docRef.current.destroy();
        }
        docRef.current = new Y.Doc();

        // Provider 설정: token을 params에 포함
        const provider = new WebsocketProvider(wsUrl, noteId, docRef.current, {
            params: { token: token || '' }
        });
        providerRef.current = provider;

        const yBlocks = docRef.current.getArray<YBlockMap>('blocks');

        // 상태 초기화 (중복 방지)
        setBlocks([]);
        setIsSynced(false);

        // 초기 동기화 관찰
        provider.on('synced', (state: any) => {
            console.log('[Yjs] Synced state:', state);
            setIsSynced(true);
            updateBlocksState();
        });

        // 데이터 변경 관찰
        yBlocks.observe(() => {
            updateBlocksState();
        });

        const updateBlocksState = () => {
            const currentBlocks = yBlocks.toArray().map((yBlock: YBlockMap) => {
                const properties = yBlock.get('properties') as Y.Map<any>;
                const type = yBlock.get('_class') as BlockType;

                // properties가 없을 경우 대비
                if (!properties) {
                    // console.warn('[Yjs] Block missing properties:', yBlock.toJSON());
                    return null;
                }

                let content = '';
                let language = undefined;

                if (type === 'code') {
                    // code 타입은 content 대신 code 필드를 사용할 수도 있음 (데모 기준)
                    // 데모: properties.set("code", new Y.Text());
                    const codeText = properties.get('code');
                    content = codeText ? codeText.toString() : '';
                    language = properties.get('language');
                } else {
                    const contentText = properties.get('content');
                    content = contentText ? contentText.toString() : '';
                }

                return {
                    id: yBlock.get('blockId'),
                    type: type,
                    content: content,
                    language: language,
                } as BlockData;
            }).filter(Boolean) as BlockData[];

            // console.log('[Yjs] Blocks updated:', currentBlocks);
            setBlocks(currentBlocks);
        };

        // 초기화 시 한 번 상태 업데이트 (기존 데이터가 있을 수 있음)
        /* 
           주의: 초기 연결 시에는 데이터가 비어있을 수 있으므로 
           synced 이벤트 이후에 확실한 데이터를 보장받지만,
           로컬에서 이미 데이터가 로드된 경우를 위해 호출.
        */

        return () => {
            console.log(`[Yjs] Disconnecting from ${noteId}...`);
            provider.destroy();
            docRef.current.destroy(); // 문서도 파괴
            setBlocks([]); // 언마운트 시 상태 비우기
        };
    }, [noteId, wsUrl]);

    // 블록 추가
    const addBlock = (prevBlockId: number | string | null, type: BlockType) => {
        const doc = docRef.current;
        const yBlocks = doc.getArray<YBlockMap>('blocks');
        const newBlockId = crypto.randomUUID();

        doc.transact(() => {
            const newBlockMap = new Y.Map();

            newBlockMap.set('blockId', newBlockId);
            newBlockMap.set('noteId', noteId);
            newBlockMap.set('_class', type);
            // newBlockMap.set('order', ...); // 순서는 배열 인덱스로 관리되므로 필수 아님, 필요시 추가

            const properties = new Y.Map();
            if (type === 'code') {
                properties.set('code', new Y.Text('')); // 빈 코드로 시작
                properties.set('language', 'javascript');
                properties.set('version', '17'); // 예시 값
                properties.set('executionMode', 'local');
            } else {
                properties.set('content', new Y.Text(''));
            }
            newBlockMap.set('properties', properties);

            // 삽입 위치 결정
            let insertIndex = yBlocks.length; // 기본: 맨 뒤
            if (prevBlockId) {
                const prevIndex = blocks.findIndex(b => b.id === prevBlockId);
                if (prevIndex !== -1) {
                    insertIndex = prevIndex + 1;
                }
            }

            yBlocks.insert(insertIndex, [newBlockMap]);
        });

        return newBlockId;
    };

    // 블록 업데이트 (내용 변경)
    // CRDT-safe: diff 기반으로 변경된 부분만 업데이트하여 동시 편집 충돌 방지
    const updateBlock = (blockId: number | string, newContent: string) => {
        const doc = docRef.current;
        const yBlocks = doc.getArray<YBlockMap>('blocks');

        const index = blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;

        const targetBlock = yBlocks.get(index);
        const properties = targetBlock.get('properties') as Y.Map<any>;
        const type = targetBlock.get('_class');

        // Y.Text 업데이트 트랜잭션
        doc.transact(() => {
            let yText;
            if (type === 'code') {
                yText = properties.get('code') as Y.Text;
            } else {
                yText = properties.get('content') as Y.Text;
            }

            if (yText) {
                const currentStr = yText.toString();
                if (currentStr !== newContent) {
                    // diff 기반 업데이트: 변경된 부분만 수정
                    applyTextDiff(yText, currentStr, newContent);
                }
            }
        });
    };

    // 블록 삭제
    const deleteBlock = (blockId: number | string) => {
        const doc = docRef.current;
        const yBlocks = doc.getArray<YBlockMap>('blocks');

        const index = blocks.findIndex(b => b.id === blockId);
        if (index !== -1) {
            yBlocks.delete(index, 1);
        }
    };

    // 블록 이동
    const moveBlock = (fromIndex: number, toIndex: number) => {
        const doc = docRef.current;
        const yBlocks = doc.getArray<YBlockMap>('blocks');

        if (fromIndex === toIndex) return;

        doc.transact(() => {
            const targetBlock = yBlocks.get(fromIndex);
            if (!targetBlock) return;

            // 1. 블록 데이터 복제 (Deep Clone)
            const newBlockMap = new Y.Map();

            // 기본 필드 복사
            const blockId = targetBlock.get('blockId');
            const noteId = targetBlock.get('noteId');
            const type = targetBlock.get('_class');

            newBlockMap.set('blockId', blockId);
            newBlockMap.set('noteId', noteId);
            newBlockMap.set('_class', type);

            // Properties 복사 (Deep Copy for Y.Text)
            const oldProperties = targetBlock.get('properties') as Y.Map<any>;
            const newProperties = new Y.Map();

            if (oldProperties) {
                oldProperties.forEach((value, key) => {
                    if (value instanceof Y.Text) {
                        newProperties.set(key, new Y.Text(value.toString()));
                    } else {
                        newProperties.set(key, value);
                    }
                });
            }
            newBlockMap.set('properties', newProperties);

            // 2. 새 위치에 삽입 후 기존 삭제 (순서 중요)
            if (fromIndex < toIndex) {
                // 아래로 이동
                yBlocks.insert(toIndex + 1, [newBlockMap]);
                yBlocks.delete(fromIndex, 1);
            } else {
                // 위로 이동
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
        moveBlock
    };
};
