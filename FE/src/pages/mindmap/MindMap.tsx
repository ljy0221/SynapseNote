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
    updateEdge         // 엣지 업데이트 유틸리티
} from 'reactflow';

// 컴포넌트 임포트 (아키텍처 경로 준수)
import MindmapCanvas from '../../components/features/mindmap/MindmapCanvas';
import { NodeSelectorModal } from '../../components/features/mindmap/NodeSelectorModal';
import { MindmapToolbar } from '../../components/layout/mindmap/MindmapToolbar';
import ConfirmModal from '../../components/common/modal/ConfirmModal';
import { ToastNotification } from '../../components/common/toast/ToastNotification'; // [New]
import { useNodeRepulsion } from '../../hooks/useNodeRepulsion';
import './MindMap.css';

// ... (기존 임포트 유지)

const MindMapContent: React.FC = () => {
    // 1. 상태 관리
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isInitialFitDone, setIsInitialFitDone] = useState(false);

    // [New] 노트 선택 모달 상태
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // 2. React Flow 전용 노드/엣지 상태
    const [nodes, setNodes, onNodesChange] = useNodesState([
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
                pointerEvents: 'none',
            },
            draggable: false,
            selectable: false,
            connectable: false,
        },
        {
            id: '1',
            type: 'note',
            data: { title: '시냅스 시작점', directoryPath: '/root' },
            position: { x: 0, y: 0 },
        },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // 3. 삭제 모달 상태 관리
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');

    // 4. [New] 클릭 연결 모드 상태
    const [isConnectMode, setIsConnectMode] = useState(false);
    const [connectSource, setConnectSource] = useState<Node | null>(null);

    // [New] 연결 해제 모드 상태
    const [isDisconnectMode, setIsDisconnectMode] = useState(false);
    const [disconnectSource, setDisconnectSource] = useState<Node | null>(null);

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

    // [New] 방향 전환 확인 모달 상태
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [swapParams, setSwapParams] = useState<{ oldEdgeId: string; newConnection: Connection } | null>(null);

    // ... (기존 state 유지)

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
    }, []);

    const closeToast = useCallback(() => {
        setIsToastVisible(false);
    }, []);


    // ... (기존 로직 유지)

    /**
     * 기능 1: 노드 추가 버튼 클릭 핸들러
     * [Modified] 바로 생성하지 않고 모달을 오픈함
     */
    const handleAddNodeClick = useCallback(() => {
        setIsSelectorOpen(true);
    }, []);

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
            showToast("자기 자신에게는 연결할 수 없습니다.");
            return;
        }

        // 2. 역방향 연결 감지 (B -> A 시도 시 A -> B가 있는지 확인)
        const reverseEdge = edges.find(e => e.source === params.target && e.target === params.source);

        if (reverseEdge) {
            // 역방향 연결이 존재하면 모달 띄우기
            setSwapParams({ oldEdgeId: reverseEdge.id, newConnection: params as Connection });
            setIsSwapModalOpen(true);
            return;
        }

        // 3. 정상 연결 (새로운 연결)
        const newEdge = {
            ...params,
            animated: true,
            style: { stroke: 'var(--color-point)', strokeWidth: 2 }
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [edges, setEdges]); // edges 의존성 추가 필요

    // [New] 연결 방향 교체 실행 핸들러
    const handleConfirmSwap = useCallback(() => {
        if (!swapParams) return;

        setEdges((eds) => {
            // 1. 기존 역방향 엣지 삭제
            const filtered = eds.filter(e => e.id !== swapParams.oldEdgeId);

            // 2. 새로운 방향 엣지 생성 (핸들 계산 로직 필요 시 추가, 여기선 기본값 사용)
            // 참고: onConnect의 로직을 재사용하거나 단순 추가
            // 여기선 단순 추가 (onConnect 내부 로직과 동일하게)
            const newEdge = {
                ...swapParams.newConnection,
                id: `e${swapParams.newConnection.source}-${swapParams.newConnection.target}-${Date.now()}`,
                animated: true,
                style: { stroke: 'var(--color-point)', strokeWidth: 2 }
            };

            return addEdge(newEdge, filtered);
        });

        // 3. 알림 표시 및 초기화
        showToast("연결 방향이 반대로 변경되었습니다.");
        setIsSwapModalOpen(false);
        setSwapParams(null);
    }, [swapParams, setEdges, showToast]);

    const handleCancelSwap = useCallback(() => {
        setIsSwapModalOpen(false);
        setSwapParams(null);
    }, []);



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
                // width/height가 있으면 중앙값 계산: x + width/2
                if (boundaryNode.style?.width && boundaryNode.style?.height) {
                    const bx = boundaryNode.position.x;
                    const by = boundaryNode.position.y;
                    const bw = Number(boundaryNode.style.width);
                    const bh = Number(boundaryNode.style.height);
                    startX = bx + bw / 2;
                    startY = by + bh / 2;
                }
            }

            // 기존 노드가 있으면 마지막 노드 기준 우측 배치, 없으면 계산된 중앙값
            const newX = lastNode ? lastNode.position.x + 150 : startX;
            const newY = lastNode ? lastNode.position.y : startY;

            const newNode = {
                id: noteData.id || Date.now().toString(), // 노트 ID 사용 (없으면 타임스탬프)
                type: 'note',
                data: {
                    title: noteData.title,
                    directoryPath: noteData.path,
                    connectionCount: 0
                },
                position: { x: newX, y: newY },
                selected: true,
            };

            // 생성된 노드로 화면 이동 (포커싱)
            setTimeout(() => {
                setCenter(newX + 30, newY + 30, { zoom: 1.2, duration: 1000 });
            }, 50);

            // 기존 노드들의 선택 해제 후 새 노드 추가
            return nds.map(n => ({ ...n, selected: false })).concat([newNode]);
        });

        setIsSelectorOpen(false); // 모달 닫기
    }, [setNodes, setCenter]);

    // ... (기존 핸들러들: handleDeleteElements, executeDelete 등 유지)


    // ... (export 유지)

    /**
     * 기능 2: 선택된 노드 및 연결선 삭제
     */
    /**
     * 기능 2: 선택된 노드 및 연결선 삭제 (모달 호출)
     */
    const handleDeleteElements = useCallback(() => {
        const selectedNodes = nodes.filter((node) => node.selected);

        if (selectedNodes.length === 0) return; // 선택된 게 없으면 무시

        if (selectedNodes.length === 1) {
            setDeleteMessage(`정말 '${selectedNodes[0].data.title}' 노드를\n삭제하시겠습니까?`);
        } else {
            setDeleteMessage(`정말 ${selectedNodes.length}개의 노드를\n삭제하시겠습니까?`);
        }

        setIsDeleteModalOpen(true);
    }, [nodes]);

    /**
     * 기능 2-1: 실제 삭제 실행 (모달 확인 시)
     */
    const executeDelete = useCallback(() => {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
        setIsDeleteModalOpen(false); // 모달 닫기
    }, [setNodes, setEdges]);

    const cancelDelete = useCallback(() => {
        setIsDeleteModalOpen(false);
    }, []);

    /**
     * 기능 3: 화면 최적화 (Fit View)
     */
    // handleFitView unused removed



    /**
     * 기능 5: 노드 클릭 시 화면 중앙으로 부드럽게 이동
     * + [New] 연결 모드일 경우 소스/타겟 지정하여 연결 생성
     */
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        // A. 연결 모드일 때
        if (isConnectMode) {
            if (!connectSource) {
                // 1단계: 소스 노드 선택
                setConnectSource(node);
                // 시각적 피드백 (선택됨)
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

                // ... (연결 로직은 기존 유지) ...


                // [New] 최적의 핸들 방향 계산 로직
                const { sourceHandle, targetHandle } = getSmartHandlePosition(connectSource, node);

                // [Modified] 단방향 연결 제약 추가
                // 1. 중복 연결 방지
                const isDuplicate = edges.some(e => e.source === connectSource.id && e.target === node.id);
                if (isDuplicate) {
                    setConnectSource(null);
                    return;
                }

                // 2. 역방향 연결 감지
                const reverseEdge = edges.find(e => e.source === node.id && e.target === connectSource.id);
                if (reverseEdge) {
                    // 역방향 연결이 존재하면 모달 띄우기
                    // 주의: 여기서는 params 형태가 아니라 직접 Connection 객체 구조를 만들어야 함
                    const newConnection: Connection = {
                        source: connectSource.id,
                        target: node.id,
                        sourceHandle: sourceHandle || null,
                        targetHandle: targetHandle || null
                    };
                    setSwapParams({ oldEdgeId: reverseEdge.id, newConnection });
                    setIsSwapModalOpen(true);
                    setConnectSource(null); // 연결 소스 초기화
                    return;
                }

                // 3. 정상 연결 (엣지 생성)
                const newEdge = {
                    id: `e${connectSource.id}-${node.id}-${Date.now()}`,
                    source: connectSource.id,
                    target: node.id,
                    sourceHandle: sourceHandle, // 계산된 소스 핸들
                    targetHandle: targetHandle, // 계산된 타겟 핸들
                    animated: true,
                    style: { stroke: 'var(--color-point)', strokeWidth: 2 }
                };
                setEdges((eds) => addEdge(newEdge, eds));

                // 초기화
                setConnectSource(null);
            }
            return; // 연결 모드에선 줌인/이동 방지
        }

        // B. [New] 연결 해제 모드일 때
        if (isDisconnectMode) {
            if (!disconnectSource) {
                // 1단계: 삭제할 연결의 시작점 노드 선택
                setDisconnectSource(node);
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
            } else {
                // 2단계: 끝점 노드 선택하여 엣지 삭제
                if (disconnectSource.id === node.id) {
                    setDisconnectSource(null);
                    return;
                }

                // 두 노드 사이의 엣지 찾기 (방향 무관)
                const targetEdge = edges.find(e =>
                    (e.source === disconnectSource.id && e.target === node.id) ||
                    (e.source === node.id && e.target === disconnectSource.id)
                );

                if (targetEdge) {
                    setEdges(eds => eds.filter(e => e.id !== targetEdge.id));
                }

                setDisconnectSource(null);
            }
            return;
        }

        // C. 일반 모드일 때 (기존 로직)
        // 노드의 중심 좌표 계산
        const targetX = node.position.x + 30; // 노드 너비 절반
        const targetY = node.position.y + 30; // 노드 높이 절반
        setCenter(targetX, targetY, { zoom: 1.2, duration: 1000 });
    }, [
        isConnectMode,
        connectSource,
        isDisconnectMode,     // [Fix] 의존성 추가
        disconnectSource,     // [Fix] 의존성 추가
        edges,                // [Fix] 엣지 검색을 위해 필수
        setCenter,
        setNodes,
        setEdges,
        getSmartHandlePosition // 의존성 추가
    ]);

    /**
     * 기능 7: 연결 모드 토글 핸들러
     */
    const toggleConnectMode = useCallback(() => {
        setIsConnectMode(prev => !prev);
        setIsDisconnectMode(false); // [New] 상호 배제
        setConnectSource(null);
    }, []);

    // [New] 연결 해제 모드 토글
    const toggleDisconnectMode = useCallback(() => {
        setIsDisconnectMode(prev => !prev);
        setIsConnectMode(false); // [New] 상호 배제
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
    }, [setNodes, setEdges]);

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
                    {isEditMode ? 'EDIT MODE' : 'READ MODE'}
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
                        onClick={() => setIsEditMode(!isEditMode)}
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

                {/* [New] 노트 선택 모달 */}
                <NodeSelectorModal
                    isOpen={isSelectorOpen}
                    onClose={() => setIsSelectorOpen(false)}
                    onSelect={handleSelectNote}
                />

                {/* 삭제 확인 모달 */}
                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    message={deleteMessage}
                    onConfirm={executeDelete}
                    onCancel={cancelDelete}
                />

                {/* [New] 방향 전환 확인 모달 */}
                <ConfirmModal
                    isOpen={isSwapModalOpen}
                    message={`이미 연결된 관계입니다.\n방향을 반대로 변경하시겠습니까?`}
                    onConfirm={handleConfirmSwap}
                    onCancel={handleCancelSwap}
                />

                {/* [New] 토스트 알림 */}
                <ToastNotification
                    message={toastMessage}
                    isVisible={isToastVisible}
                    onClose={closeToast}
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