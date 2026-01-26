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
                if (node.data.connectionCount !== newCount) {
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

    // ... (기존 state 유지: nodes, edges, modals, connect modes)

    /**
     * 기능 1: 노드 추가 버튼 클릭 핸들러
     * [Modified] 바로 생성하지 않고 모달을 오픈함
     */
    const handleAddNodeClick = useCallback(() => {
        setIsSelectorOpen(true);
    }, []);

    /**
     * 기능 1-1: 모달에서 노트를 선택했을 때 실제 노드 생성
     */
    const handleSelectNote = useCallback((noteData: any) => {
        setNodes((nds) => {
            // 마지막 노드 위치를 기준으로 새 위치 계산 (없으면 중앙)
            const lastNode = nds[nds.length - 1];
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const newX = lastNode ? lastNode.position.x + 150 : centerX;
            const newY = lastNode ? lastNode.position.y : centerY;

            const newNode: Node = {
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
            return nds.map(n => ({ ...n, selected: false })).concat(newNode);
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
    const handleFitView = useCallback(() => {
        fitView({ duration: 800, padding: 0.2 });
    }, [fitView]);

    /**
     * 기능 4: 노드 간 연결 설정
     */
    const onConnect = useCallback((params: Connection | Edge) => {
        const newEdge = {
            ...params,
            animated: true,
            style: { stroke: 'var(--color-point)', strokeWidth: 2 }
        };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [setEdges]);

    /**
     * 기능 5: 노드 클릭 시 화면 중앙으로 부드럽게 이동
     * + [New] 연결 모드일 경우 소스/타겟 지정하여 연결 생성
     */
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
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
                const sourcePos = connectSource.position;
                const targetPos = node.position;

                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;

                let sourceHandle = 'bottom-s'; // 기본값
                let targetHandle = 'top-t';   // 기본값

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

                // 엣지 생성
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
        setEdges
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
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                position: {
                    x: Math.round(node.position.x / GRID_SIZE) * GRID_SIZE,
                    y: Math.round(node.position.y / GRID_SIZE) * GRID_SIZE,
                }
            }))
        );
    }, [setNodes]);

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