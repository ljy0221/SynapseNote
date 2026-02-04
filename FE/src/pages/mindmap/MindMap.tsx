import React, { useState, useCallback, useEffect } from 'react';
import { Edit, Save } from 'lucide-react';
import {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider, // useReactFlow 사용을 위한 필수 Provider
    useReactFlow,      // 캔버스 제어를 위한 훅
    updateEdge,        // 엣지 업데이트 유틸리티
} from 'reactflow';

// 컴포넌트 임포트 (아키텍처 경로 준수)
import MindmapCanvas from '../../components/features/mindmap/MindmapCanvas';
import { MindmapToolbar } from '../../components/layout/mindmap/MindmapToolbar'; // [Restored]
import { useModalStore } from '../../store/useModalStore'; // [New]
import { ToastNotification } from '../../components/common/toast/ToastNotification'; // [New]
import { useNodeRepulsion } from '../../hooks/useNodeRepulsion';
import './MindMap.css';

// ... (기존 임포트 유지)
import { getMindmapApi, syncMindmapApi } from '../../api/mindmap/Mindmap.api';
import { SyncMindmapRequest } from '../../types/mindmap/Requests';
import { MindmapNode, MindmapEdge } from '../../types/mindmap/Mindmap';


const MindMapContent: React.FC = () => {
    // 1. 상태 관리
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isInitialFitDone, setIsInitialFitDone] = useState(false);

    // [New] 노트 선택 모달 상태 (제거됨 - Global Store 사용)


    // 2. React Flow 전용 노드/엣지 상태
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // [New] 데이터 로딩 상태 (사용 예정 or 제거)
    // const [loading, setLoading] = useState(true);

    // [New] 초기 데이터 로드 (API)
    useEffect(() => {
        const fetchMindmap = async () => {
            try {
                // setLoading(true);
                const response = await getMindmapApi();
                if (response) {
                    const { nodes: serverNodes, edges: serverEdges } = response;

                    // 1. 서버 노드 -> ReactFlow 노드 변환
                    let constructedNodes: Node[] = [];

                    if (serverNodes && serverNodes.length > 0) {
                        constructedNodes = serverNodes.map((n: MindmapNode) => ({
                            id: n.id,
                            type: 'note',
                            position: { x: n.x, y: n.y },
                            data: { title: n.title, connectionCount: 0 },
                        }));
                        // Boundary Node 추가 (필수)
                        const boundaryNode = {
                            id: 'world-boundary',
                            type: 'default',
                            data: { title: '' },
                            position: { x: -4000, y: -3000 },
                            style: {
                                width: 8000,
                                height: 6000,
                                border: '4px dashed rgba(200, 200, 200, 0.5)',
                                backgroundColor: 'transparent',
                                zIndex: -1000,
                                pointerEvents: 'none' as const,
                            },
                            draggable: false,
                            selectable: false,
                            connectable: false,
                        };
                        setNodes([boundaryNode, ...constructedNodes]);
                    } else {
                        // 데이터가 없으면 기본 노드 설정 (Boundary만 추가)
                        setNodes([
                            {
                                id: 'world-boundary',
                                type: 'default',
                                data: { title: '' },
                                position: { x: -4000, y: -3000 },
                                style: {
                                    width: 8000,
                                    height: 6000,
                                    border: '4px dashed rgba(200, 200, 200, 0.5)',
                                    backgroundColor: 'transparent',
                                    zIndex: -1000,
                                    pointerEvents: 'none' as const,
                                },
                                draggable: false,
                                selectable: false,
                                connectable: false,
                            },
                        ]);
                    }

                    // 2. 서버 엣지 -> ReactFlow 엣지 변환
                    if (serverEdges && serverEdges.length > 0) {
                        const newEdges = serverEdges.map((e: MindmapEdge) => {
                            // [Fix] 스코프 문제 해결된 노드 리스트 사용
                            const sourceNode = constructedNodes.find(n => n.id === e.fromId);
                            const targetNode = constructedNodes.find(n => n.id === e.toId);

                            let sourceHandle = 'bottom-s';
                            let targetHandle = 'top-t';

                            if (sourceNode && targetNode) {
                                const dx = targetNode.position.x - sourceNode.position.x;
                                const dy = targetNode.position.y - sourceNode.position.y;

                                if (Math.abs(dx) > Math.abs(dy)) {
                                    if (dx > 0) { // 타겟이 오른쪽에 있음
                                        sourceHandle = 'right-s';
                                        targetHandle = 'left-t';
                                    } else { // 타겟이 왼쪽에 있음
                                        sourceHandle = 'left-s';
                                        targetHandle = 'right-t';
                                    }
                                } else {
                                    if (dy > 0) { // 타겟이 아래에 있음
                                        sourceHandle = 'bottom-s';
                                        targetHandle = 'top-t';
                                    } else { // 타겟이 위에 있음
                                        sourceHandle = 'top-s';
                                        targetHandle = 'bottom-t';
                                    }
                                }
                            }

                            return {
                                id: `e${e.fromId}-${e.toId}`,
                                source: e.fromId,
                                target: e.toId,
                                sourceHandle, // calculated handle
                                targetHandle, // calculated handle
                                type: 'synapse', // [New] 시냅스 엣지 사용
                                style: { stroke: 'var(--color-point)', strokeWidth: 2 }
                            };
                        });
                        setEdges(newEdges);
                    } else {
                        setEdges([]);
                    }
                }
            } catch (error) {
                console.error("마인드맵 로드 실패:", error);
                // 에러 처리 (토스트 등)
                showToast("마인드맵 데이터를 불러오는데 실패했습니다.", 'error');
            } finally {
                // setLoading(false);
            }
        };

        fetchMindmap();
    }, [setNodes, setEdges]);

    // 3. [Modified] 모달 상태 제거 (Global Store 사용)
    // const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // const [deleteMessage, setDeleteMessage] = useState('');

    // [New] 중복 노드 알림 모달 상태 삭제됨
    // const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    // const [duplicateNodeId, setDuplicateNodeId] = useState<string | null>(null);

    // 4. [New] 클릭 연결 모드 상태
    const [isConnectMode, setIsConnectMode] = useState(false);
    const [connectSource, setConnectSource] = useState<Node | null>(null);

    // [New] 연결 해제 모드 상태
    const [isDisconnectMode, setIsDisconnectMode] = useState(false);
    const [disconnectSource, setDisconnectSource] = useState<Node | null>(null);

    // [Safety] Edit Mode 해제 시 모든 인터랙션 모드 초기화
    useEffect(() => {
        if (!isEditMode) {
            setIsConnectMode(false);
            setConnectSource(null);
            setIsDisconnectMode(false);
            setDisconnectSource(null);
            // 모달 닫기 로직 제거 (Store에서 관리하거나 필요 시 closeAll 호출)
        }
    }, [isEditMode]);

    // 5. React Flow 내부 제어 함수 가져오기
    const { fitView, setCenter } = useReactFlow();

    // 4. [New] 엣지 변경 시 노드의 connectionCount(비중) 업데이트 로직
    useEffect(() => {
        const counts: Record<string, number> = {};
        edges.forEach((edge) => {
            counts[edge.source] = (counts[edge.source] || 0) + 1;
        });

        setNodes((nds) =>
            nds.map((node) => {
                const newCount = counts[node.id] || 0;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((node.data as any).connectionCount !== newCount) {
                    return {
                        ...node,
                        data: { ...node.data, connectionCount: newCount }
                    };
                }
                return node;
            })
        );
    }, [edges, setNodes]);

    // 5. [New] 초기 로딩 시 콘텐츠 영역에만 줌인 (Boundary 제외)
    useEffect(() => {
        if (!isInitialFitDone && nodes.length > 0) {
            setTimeout(() => {
                const contentNodes = nodes.filter(n => n.id !== 'world-boundary');
                fitView({
                    nodes: contentNodes,
                    duration: 1000,
                    padding: 0.5,
                    minZoom: 0.5,
                    maxZoom: 1.2
                });
                setIsInitialFitDone(true);
            }, 100);
        }
    }, [isInitialFitDone, nodes, fitView]);

    // 6. [New] 노드 간 충돌 방지 (물리 엔진 -> 충돌 방지 로직 대체)
    const { onNodeDragStart, onNodeDrag: onNodeRepulsionDrag, onNodeDragStop } = useNodeRepulsion({ active: true });

    // [Helper] 두 노드 간 최적의 핸들 위치 계산
    const getSmartHandlePosition = useCallback((sourceNode: Node, targetNode: Node) => {
        const sourcePos = sourceNode.position;
        const targetPos = targetNode.position;
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;

        let sourceHandle = 'bottom-s';
        let targetHandle = 'top-t';

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) { // 타겟이 오른쪽에 있음
                sourceHandle = 'right-s';
                targetHandle = 'left-t';
            } else { // 타겟이 왼쪽에 있음
                sourceHandle = 'left-s';
                targetHandle = 'right-t';
            }
        } else {
            if (dy > 0) { // 타겟이 아래에 있음
                sourceHandle = 'bottom-s';
                targetHandle = 'top-t';
            } else { // 타겟이 위에 있음
                sourceHandle = 'top-s';
                targetHandle = 'bottom-t';
            }
        }
        return { sourceHandle, targetHandle };
    }, []);

    // [Wrapper] 통합 드래그 핸들러 (충돌 방지 + 엣지 최적화)
    const handleNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
        // 1. 충돌 방지 로직 실행
        onNodeRepulsionDrag(event, node);

        // 2. 엣지 최적화 로직 실행
        setEdges((eds) => eds.map((edge) => {
            if (edge.source === node.id || edge.target === node.id) {
                // 연결된 상대방 노드 찾기
                const targetId = edge.source === node.id ? edge.target : edge.source;
                const targetNode = nodes.find((n) => n.id === targetId);

                if (targetNode) {
                    const { sourceHandle, targetHandle } = edge.source === node.id
                        ? getSmartHandlePosition(node, targetNode)
                        : getSmartHandlePosition(targetNode, node);

                    // 변경사항이 있을 때만 업데이트 (성능 최적화)
                    if (edge.sourceHandle !== sourceHandle || edge.targetHandle !== targetHandle) {
                        return { ...edge, sourceHandle, targetHandle };
                    }
                }
            }
            return edge;
        }));
    }, [onNodeRepulsionDrag, nodes, setEdges, getSmartHandlePosition]);

    // [New] 토스트 알림 상태
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');


    // [New] Global Modal Store
    const { openModal, closeAll } = useModalStore();

    // [Modified] swapParams 상태 제거 -> 로컬 변수나 클로저로 처리

    // ... (기존 state 유지)

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setIsToastVisible(true);
    }, []);

    const closeToast = useCallback(() => {
        setIsToastVisible(false);
    }, []);


    // ... (기존 로직 유지)




    /**
     * 기능 4: 노드 간 연결 설정
     * [Modified] 단방향 연결 제약 추가 (역방향 연결 시도 시 교체 확인)
     */
    const onConnect = useCallback((params: Connection | Edge) => {
        // 1. 중복 연결 방지 (이미 같은 방향의 연결이 있으면 무시)
        const isDuplicate = edges.some(e => e.source === params.source && e.target === params.target);
        if (isDuplicate) return;

        // [New] 자기 자신 연결 방지 (제약 조건 추가)
        if (params.source === params.target) {
            showToast("자기 자신에게는 연결할 수 없습니다.", 'error');
            return;
        }

        // 2. 역방향 연결 감지 (B -> A 시도 시 A -> B가 있는지 확인)
        const reverseEdge = edges.find(e => e.source === params.target && e.target === params.source);

        if (reverseEdge) {
            // 역방향 연결이 존재하면 모달 띄우기
            // setSwapParams({ oldEdgeId: reverseEdge.id, newConnection: params as Connection });
            // setIsSwapModalOpen(true);

            // [Modified] Global Modal 사용
            openModal('CONFIRM', {
                message: `이미 연결된 관계입니다.\n방향을 반대로 변경하시겠습니까?`,
                onConfirm: () => handleConfirmSwap(reverseEdge.id, params as Connection),
                onCancel: closeAll,
            });
            return;
        }

        // 3. 정상 연결 (새로운 연결)
        const newEdge = {
            ...params,
            type: 'synapse', // [New] 시냅스 엣지 사용
            style: { stroke: 'var(--color-point)', strokeWidth: 2 }
        };
        setEdges((eds) => addEdge(newEdge, eds));

        // [Toast] 연결 성공 알림
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        const sTitle = sourceNode?.data?.title || 'Unknown';
        const tTitle = targetNode?.data?.title || 'Unknown';
        showToast(`'${sTitle}'와 '${tTitle}'의 지식이 연결되었습니다.`);

    }, [edges, setEdges, nodes, showToast]);

    // [New] 연결 방향 교체 실행 핸들러 (인자 받도록 수정)
    const handleConfirmSwap = useCallback((oldEdgeId: string, newConnection: Connection) => {
        setEdges((eds) => {
            // 1. 기존 역방향 엣지 삭제
            const filtered = eds.filter(e => e.id !== oldEdgeId);

            // 2. 새로운 방향 엣지 생성
            const newEdge = {
                ...newConnection,
                id: `e${newConnection.source}-${newConnection.target}-${Date.now()}`,
                type: 'synapse', // [New] 시냅스 엣지 사용
                style: { stroke: 'var(--color-point)', strokeWidth: 2 }
            };

            return addEdge(newEdge, filtered);
        });

        // 3. 알림 표시
        showToast("연결 방향이 반대로 변경되었습니다.");
        closeAll();
    }, [setEdges, showToast, closeAll]);

    // handleCancelSwap 삭제 (Modal onClose에서 처리)

    /**
     * 기능 1-1: 모달에서 노트를 선택했을 때 실제 노드 생성
     */
    const handleSelectNote = useCallback((noteData: any) => {
        setNodes((nds) => {
            // [Modified] 실제 콘텐츠 노드만 필터링 (Boundary 제외)
            const contentNodes = nds.filter(n => n.id !== 'world-boundary');
            const lastNode = contentNodes[contentNodes.length - 1];

            // 노드가 하나도 없으면 Boundary의 중앙 좌표 계산
            let startX = 0;
            let startY = 0;

            const boundaryNode = nds.find(n => n.id === 'world-boundary');
            if (boundaryNode) {
                if (boundaryNode.style?.width && boundaryNode.style?.height) {
                    const bx = boundaryNode.position.x;
                    const by = boundaryNode.position.y;
                    const bw = Number(boundaryNode.style.width);
                    const bh = Number(boundaryNode.style.height);
                    startX = bx + bw / 2;
                    startY = by + bh / 2;
                }
            }

            const newX = lastNode ? lastNode.position.x + 150 : startX;
            const newY = lastNode ? lastNode.position.y : startY;

            if (!noteData.id) {
                console.error("Invalid note data: missing ID");
                return nds;
            }

            const isDuplicate = nds.some(n => n.id === noteData.id);

            // [New] 중복 체크 로직 (Modified: Toast + Auto Select)
            if (isDuplicate) {
                // 1. Toast 알림
                showToast("이미 생성되어있는 지식입니다.", 'error');

                // 2. 해당 노드로 이동 및 선택
                const targetNode = nds.find(n => n.id === noteData.id);
                if (targetNode) {
                    setTimeout(() => {
                        setCenter(targetNode.position.x + 30, targetNode.position.y + 30, { zoom: 1.2, duration: 1000 });
                    }, 50);

                    return nds.map(n => ({
                        ...n,
                        selected: n.id === noteData.id
                    }));
                }

                return nds;
            }

            const newNode = {
                id: noteData.id,
                type: 'note',
                data: {
                    title: noteData.title,
                    directoryPath: noteData.path,
                    connectionCount: 0
                },
                position: { x: newX, y: newY },
                selected: true,
            };

            setTimeout(() => {
                setCenter(newX + 30, newY + 30, { zoom: 1.2, duration: 1000 });
            }, 50);


            return nds.map(n => ({ ...n, selected: false })).concat([newNode]);
        });

        closeAll();
    }, [setNodes, setCenter, showToast, closeAll]); // showToast 추가됨


    /**
     * 기능 1: 노드 추가 버튼 클릭 핸들러
     * [Modified] 바로 생성하지 않고 모달을 오픈함
     */
    const handleAddNodeClick = useCallback(() => {
        openModal('NODE_SELECTOR', {
            onSelect: (noteData: any) => handleSelectNote(noteData),
            existingNodeIds: nodes.map(n => n.id)
        });
    }, [openModal, nodes, handleSelectNote]);


    // handleDuplicateModalClose 삭제됨


    /**
     * 기능 2: 선택된 노드 및 연결선 삭제 (모달 호출)
     */
    /**
     * 기능 2-1: 실제 삭제 실행 (모달 확인 시)
     */
    const executeDelete = useCallback(() => {
        // [Toast] 삭제 알림 로직
        const selectedNodes = nodes.filter((node) => node.selected);
        const count = selectedNodes.length;

        if (count > 0) {
            if (count === 1) {
                showToast(`'${selectedNodes[0].data.title}'의 지식이 삭제되었습니다.`);
            } else {
                showToast(`${count}개의 지식이 삭제되었습니다.`);
            }
        }

        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
        closeAll();
    }, [setNodes, setEdges, nodes, showToast, closeAll]);

    /**
     * 기능 2: 선택된 노드 및 연결선 삭제 (모달 호출)
     */
    const handleDeleteElements = useCallback(() => {
        const selectedNodes = nodes.filter((node) => node.selected);

        if (selectedNodes.length === 0) return;

        if (selectedNodes.length === 1) {
            // setDeleteMessage(`정말 '${selectedNodes[0].data.title}' 노드를\n삭제하시겠습니까?`);
            openModal('CONFIRM', {
                message: `정말 '${selectedNodes[0].data.title}' 노드를\n삭제하시겠습니까?`,
                onConfirm: () => executeDelete(),
                onCancel: closeAll,
            });
        } else {
            openModal('CONFIRM', {
                message: `정말 ${selectedNodes.length}개의 노드를\n삭제하시겠습니까?`,
                onConfirm: () => executeDelete(),
                onCancel: closeAll,
            });
        }

        // setIsDeleteModalOpen(true);
    }, [nodes, openModal, executeDelete]); // executeDelete dependency added

    // cancelDelete 삭제

    /**
     * 기능 5: 노드 클릭 시 화면 중앙으로 부드럽게 이동
     * + [New] 연결 모드일 경우 소스/타겟 지정하여 연결 생성
     */
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        // A. 연결 모드일 때 (Edit Mode일 때만 동작)
        if (isConnectMode && isEditMode) {
            if (!connectSource) {
                // 1단계: 소스 노드 선택
                setConnectSource(node);
                setNodes(nds => nds.map(n => ({
                    ...n,
                    selected: n.id === node.id
                })));
            } else {
                // 2단계: 타겟 노드 선택 및 연결
                if (connectSource.id === node.id) {
                    setConnectSource(null);
                    return;
                }

                const { sourceHandle, targetHandle } = getSmartHandlePosition(connectSource, node);

                // 중복 연결 방지
                const isDuplicate = edges.some(e => e.source === connectSource.id && e.target === node.id);
                if (isDuplicate) {
                    setConnectSource(null);
                    return;
                }

                // 역방향 연결 감지
                const reverseEdge = edges.find(e => e.source === node.id && e.target === connectSource.id);
                if (reverseEdge) {
                    const newConnection: Connection = {
                        source: connectSource.id,
                        target: node.id,
                        sourceHandle: sourceHandle || null,
                        targetHandle: targetHandle || null
                    };
                    // setSwapParams({ oldEdgeId: reverseEdge.id, newConnection });
                    // setIsSwapModalOpen(true);
                    openModal('CONFIRM', {
                        message: `이미 연결된 관계입니다.\n방향을 반대로 변경하시겠습니까?`,
                        onConfirm: () => handleConfirmSwap(reverseEdge.id, newConnection),
                        onCancel: closeAll,
                    });

                    setConnectSource(null);
                    return;
                }

                // 정상 연결
                const newEdge = {
                    id: `e${connectSource.id}-${node.id}-${Date.now()}`,
                    source: connectSource.id,
                    target: node.id,
                    sourceHandle: sourceHandle,
                    targetHandle: targetHandle,
                    type: 'synapse',
                    style: { stroke: 'var(--color-point)', strokeWidth: 2 }
                };
                setEdges((eds) => addEdge(newEdge, eds));

                // [Toast] 연결 성공 알림 (Click Mode)
                const sTitle = connectSource.data?.title || 'Unknown';
                const tTitle = node.data?.title || 'Unknown';
                showToast(`'${sTitle}'와 '${tTitle}'의 지식이 연결되었습니다.`);

                setConnectSource(null);
            }
            return;
        }

        // B. [New] 연결 해제 모드일 때 (Edit Mode일 때만 동작)
        if (isDisconnectMode && isEditMode) {
            if (!disconnectSource) {
                setDisconnectSource(node);
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
            } else {
                if (disconnectSource.id === node.id) {
                    setDisconnectSource(null);
                    return;
                }

                // 두 노드 사이의 엣지 찾기
                const targetEdge = edges.find(e =>
                    (e.source === disconnectSource.id && e.target === node.id) ||
                    (e.source === node.id && e.target === disconnectSource.id)
                );

                if (targetEdge) {
                    setEdges(eds => eds.filter(e => e.id !== targetEdge.id));

                    // [Toast] 자식 연결 해제 알림
                    const myTitle = disconnectSource.data?.title || 'Unknown';
                    const otherTitle = node.data?.title || 'Unknown';
                    showToast(`'${myTitle}'와 '${otherTitle}'의 지식이 연결해제되었습니다.`);
                }

                setDisconnectSource(null);
            }
            return;
        }

        // C. 일반 모드일 때
        const targetX = node.position.x + 30;
        const targetY = node.position.y + 30;
        setCenter(targetX, targetY, { zoom: 1.2, duration: 1000 });
    }, [
        isConnectMode,
        connectSource,
        isDisconnectMode,
        disconnectSource,
        edges,
        setCenter,
        setNodes,
        setEdges,
        getSmartHandlePosition,
        nodes,
        showToast
    ]);

    /**
     * 기능 7: 연결 모드 토글 핸들러
     */
    const toggleConnectMode = useCallback(() => {
        setIsConnectMode(prev => !prev);
        setIsDisconnectMode(false);
        setConnectSource(null);
    }, []);

    // [New] 연결 해제 모드 토글
    const toggleDisconnectMode = useCallback(() => {
        setIsDisconnectMode(prev => !prev);
        setIsConnectMode(false);
        setDisconnectSource(null);
    }, []);

    /**
     * 기능 8: 그리드 자동 정렬 (Snap to Grid)
     * 모든 노드의 위치를 50px 단위로 반올림하여 정리
     */
    const handleAutoAlign = useCallback(() => {
        const GRID_SIZE = 50; // 격자 크기

        // 1. 노드 위치 정렬 (스냅)
        setNodes((nds) => {
            const alignedNodes = nds.map((node) => ({
                ...node,
                position: {
                    x: Math.round(node.position.x / GRID_SIZE) * GRID_SIZE,
                    y: Math.round(node.position.y / GRID_SIZE) * GRID_SIZE,
                }
            }));

            // 2. 엣지 핸들 최적화 (정렬된 위치 기준)
            setEdges((eds) => eds.map(edge => {
                const sourceNode = alignedNodes.find(n => n.id === edge.source);
                const targetNode = alignedNodes.find(n => n.id === edge.target);

                if (!sourceNode || !targetNode) return edge;

                const dx = targetNode.position.x - sourceNode.position.x;
                const dy = targetNode.position.y - sourceNode.position.y;

                let sourceHandle = 'bottom-s';
                let targetHandle = 'top-t';

                // 가로 거리가 더 멀면 좌우 연결 우선
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0) { // 타겟이 오른쪽에 있음
                        sourceHandle = 'right-s';
                        targetHandle = 'left-t';
                    } else { // 타겟이 왼쪽에 있음
                        sourceHandle = 'left-s';
                        targetHandle = 'right-t';
                    }
                } else { // 세로 거리가 더 멀면 상하 연결 우선
                    if (dy > 0) { // 타겟이 아래에 있음
                        sourceHandle = 'bottom-s';
                        targetHandle = 'top-t';
                    } else { // 타겟이 위에 있음
                        sourceHandle = 'top-s';
                        targetHandle = 'bottom-t';
                    }
                }

                return {
                    ...edge,
                    sourceHandle,
                    targetHandle
                };
            }));

            return alignedNodes;
        });

        // [Toast] 정렬 완료 알림
        showToast("지식들을 정리했습니다.");
    }, [setNodes, setEdges, showToast]);

    /**
     * 기능 6: 엣지 재연결 (Reconnect)
     * 기존 연결선의 끝을 잡고 다른 노드로 이동하여 연결 수정
     */
    const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
        setEdges((els) => updateEdge(oldEdge, newConnection, els));
    }, [setEdges]);

    return (
        <div className="page-content-container mindmap-page">
            {/* 헤더 삭제됨 - 전체 화면 사용 */}

            <main className="mindmap-canvas-area" style={{ position: 'relative', height: '100%' }}>
                {/* [New] 좌상단 모드 라벨 (툴바 위쪽) */}
                <div className={`mode-label-top-left ${isEditMode ? 'edit' : 'view'}`}>
                    <span className="mode-dot" />
                    {isEditMode
                        ? isConnectMode
                            ? 'EDIT MODE : 연결'
                            : isDisconnectMode
                                ? 'EDIT MODE : 연결해제'
                                : 'EDIT MODE : 편집'
                        : 'READ MODE'}
                </div>

                {/* [조건부 렌더링] 편집 모드일 때만 레이아웃 툴바 노출 */}
                {isEditMode && (
                    <MindmapToolbar
                        onAdd={handleAddNodeClick}
                        onDelete={handleDeleteElements}
                        onToggleConnectMode={toggleConnectMode}
                        isConnectMode={isConnectMode}
                        onToggleDisconnectMode={toggleDisconnectMode}
                        isDisconnectMode={isDisconnectMode}
                        onAlign={handleAutoAlign}
                        isEditMode={isEditMode}
                    />
                )}

                <div className="floating-top-right">
                    <button
                        className={`action-btn ${isEditMode ? 'btn-save' : 'btn-edit'}`}
                        onClick={async () => {
                            if (isEditMode) {
                                // [Save Logic] 저장 버튼 클릭 시
                                try {
                                    // 1. 노드 변환 (Boundary 제외)
                                    const contentNodes = nodes.filter(n => n.id !== 'world-boundary');
                                    const nodeDtos = contentNodes.map(n => ({
                                        nodeId: n.id,
                                        x: n.position.x,
                                        y: n.position.y
                                    }));

                                    // 2. 엣지 변환
                                    const edgeDtos = edges.map(e => ({
                                        fromId: e.source,
                                        toId: e.target
                                    }));

                                    // 3. API 호출
                                    const requestBody: SyncMindmapRequest = {
                                        nodes: nodeDtos,
                                        edges: edgeDtos
                                    };

                                    await syncMindmapApi(requestBody);
                                    showToast("지식이 저장되었습니다.", 'success');
                                    setIsEditMode(false); // 저장 후 보기 모드로 전환
                                } catch (error) {
                                    console.error("저장 실패:", error);
                                    showToast("저장에 실패했습니다.", 'error');
                                }
                            } else {
                                // [Edit Mode] 편집 모드 진입
                                setIsEditMode(true);
                            }
                        }}
                        title={isEditMode ? '변경사항 저장 (Save)' : '편집 모드 활성화 (Edit)'}
                    >
                        {isEditMode ? <Save size={20} /> : <Edit size={20} />}
                    </button>
                    {/* 상태 뱃지 삭제됨 */}
                </div>

                {/* 마인드맵 캔버스 영역 */}
                <MindmapCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeUpdate={onEdgeUpdate}
                    onNodeClick={onNodeClick}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDrag={handleNodeDrag}
                    onNodeDragStop={onNodeDragStop}
                    isEditMode={isEditMode}
                />

                {/* 편집 모드 힌트 */}

                {/* [Modifed] Modal 렌더링 삭제 (Global Modal 사용) */}
                {/* NodeSelectorModal, ConfirmModal 삭제됨 */}



                {/* [New] 토스트 알림 */}
                <ToastNotification
                    message={toastMessage}
                    isVisible={isToastVisible}
                    onClose={closeToast}
                    type={toastType}
                />
            </main>
        </div>
    );
};

/**
 * 최종 마인드맵 페이지 컴포넌트
 * useReactFlow 사용을 위해 최상위에서 Provider를 주입합니다.
 */
const MindMap: React.FC = () => {
    return (
        <ReactFlowProvider>
            <MindMapContent />
        </ReactFlowProvider>
    );
};

export default MindMap;