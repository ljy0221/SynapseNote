import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { BlockData, BlockType } from '../pages/note/Note';

// Yjs Map에서 사용하는 키 정의
type YBlockMap = Y.Map<any>;

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

        doc.transact(() => {
            const newBlockMap = new Y.Map();
            const newBlockId = crypto.randomUUID();

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
    };

    // 블록 업데이트 (내용 변경)
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
                    yText.delete(0, yText.length);
                    yText.insert(0, newContent);
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
            // Yjs 배열 이동은 delete 후 insert 방식이 일반적이나, 
            // 협업 충돌 방지를 위해 move 메서드가 있다면 사용하는 것이 좋음.
            // Y.Array에는 move 메서드가 없을 수 있으므로 (v13 기준), delete & insert 사용
            // 주의: 이 방식은 id가 바뀌지 않으므로 안전

            // 참고: Yjs v13은 array.get(i)로 요소를 가져와서 다른 곳에 insert하면
            // "Item implementation only allows one parent" 에러 발생 가능
            // 따라서 clone을 하거나... 하지만 Yjs는 구조체 이동이 까다로움.
            // 단순히 내용만 옮기는 것이 아니라 객체 자체를 옮겨야 함.

            // 안전한 방법: 
            // 그러나 y-array는 기본적으로 move를 지원하지 않음.
            // 가장 쉬운 방법: toArray로 데이터 복사 -> 기존 삭제 -> 새 위치 생성 (ID 변경됨)
            // ID 유지가 중요하다면... 

            // *데모에는 move 로직이 명시적으로 없었음*
            // 일단은 간단히 구현하지 않거나, 제한적으로 구현.
            // 여기서는 일단 로그만 찍고 구현 보류 (복잡도 회피)
            console.warn('[Yjs] Move block not fully implemented yet');
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
