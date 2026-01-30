import React, { useState, useCallback, useEffect } from 'react';
import { Edit, Save } from 'lucide-react';
import {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    useReactFlow,
    updateEdge
} from 'reactflow';

// 컴포넌트 및 기능 임포트
import MindmapCanvas from '../../components/features/mindmap/MindmapCanvas';
import { NodeSelectorModal } from '../../components/features/mindmap/NodeSelectorModal';
import { MindmapToolbar } from '../../components/layout/mindmap/MindmapToolbar';
import ConfirmModal from '../../components/common/modal/ConfirmModal';
import { ToastNotification } from '../../components/common/toast/ToastNotification';
import { useNodeRepulsion } from '../../hooks/useNodeRepulsion';
import './MindMap.css';

const MindMapContent: React.FC = () => {
    // 1. 상태 관리
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isInitialFitDone, setIsInitialFitDone] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // 2. React Flow 노드/엣지 상태
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

    // 3. 모달 및 알림 상태
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [swapParams, setSwapParams] = useState<{ oldEdgeId: string; newConnection: Connection } | null>(null);

    // 4. 연결/해제 모드 상태
    const [isConnectMode, setIsConnectMode] = useState(false);
    const [connectSource, setConnectSource] = useState<Node | null>(null);
    const [isDisconnectMode, setIsDisconnectMode] = useState(false);
    const [disconnectSource, setDisconnectSource] = useState<Node | null>(null);

    const { fitView, setCenter } = useReactFlow();

    // 노드 연결 비중 업데이트
    useEffect(() => {
        const counts: Record<string, number> = {};
        edges.forEach((edge) => {
            counts[edge.source] = (counts[edge.source] || 0) + 1;
        });

        setNodes((nds) =>
            nds.map((node) => {
                const newCount = counts[node.id] || 0;
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

    // 초기 화면 맞춤
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

    const { onNodeDragStart, onNodeDrag: onNodeRepulsionDrag, onNodeDragStop } = useNodeRepulsion({ active: true });

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
    }, []);

    const closeToast = useCallback(() => setIsToastVisible(false), []);

    const getSmartHandlePosition = useCallback((sourceNode: Node, targetNode: Node) => {
        const sourcePos = sourceNode.position;
        const targetPos = targetNode.position;
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? { sourceHandle: 'right-s', targetHandle: 'left-t' } : { sourceHandle: 'left-s', targetHandle: 'right-t' };
        }
        return dy > 0 ? { sourceHandle: 'bottom-s', targetHandle: 'top-t' } : { sourceHandle: 'top-s', targetHandle: 'bottom-t' };
    }, []);

    const handleNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
        onNodeRepulsionDrag(event, node);
        setEdges((eds) => eds.map((edge) => {
            if (edge.source === node.id || edge.target === node.id) {
                const targetId = edge.source === node.id ? edge.target : edge.source;
                const targetNode = nodes.find((n) => n.id === targetId);
                if (targetNode) {
                    const { sourceHandle, targetHandle } = edge.source === node.id
                        ? getSmartHandlePosition(node, targetNode)
                        : getSmartHandlePosition(targetNode, node);
                    if (edge.sourceHandle !== sourceHandle || edge.targetHandle !== targetHandle) {
                        return { ...edge, sourceHandle, targetHandle };
                    }
                }
            }
            return edge;
        }));
    }, [onNodeRepulsionDrag, nodes, setEdges, getSmartHandlePosition]);

    const onConnect = useCallback((params: Connection | Edge) => {
        if (params.source === params.target) {
            showToast("자기 자신에게는 연결할 수 없습니다.");
            return;
        }
        const isDuplicate = edges.some(e => e.source === params.source && e.target === params.target);
        if (isDuplicate) return;

        const reverseEdge = edges.find(e => e.source === params.target && e.target === params.source);
        if (reverseEdge) {
            setSwapParams({ oldEdgeId: reverseEdge.id, newConnection: params as Connection });
            setIsSwapModalOpen(true);
            return;
        }

        const newEdge = { ...params, animated: true, style: { stroke: 'var(--color-point)', strokeWidth: 2 } };
        setEdges((eds) => addEdge(newEdge, eds));
    }, [edges, setEdges, showToast]);

    const handleConfirmSwap = useCallback(() => {
        if (!swapParams) return;
        setEdges((eds) => {
            const filtered = eds.filter(e => e.id !== swapParams.oldEdgeId);
            const newEdge = {
                ...swapParams.newConnection,
                id: `e${swapParams.newConnection.source}-${swapParams.newConnection.target}-${Date.now()}`,
                animated: true,
                style: { stroke: 'var(--color-point)', strokeWidth: 2 }
            };
            return addEdge(newEdge, filtered);
        });
        showToast("연결 방향이 반대로 변경되었습니다.");
        setIsSwapModalOpen(false);
        setSwapParams(null);
    }, [swapParams, setEdges, showToast]);

    const handleSelectNote = useCallback((noteData: any) => {
        setNodes((nds) => {
            const contentNodes = nds.filter(n => n.id !== 'world-boundary');
            const lastNode = contentNodes[contentNodes.length - 1];
            const newX = lastNode ? lastNode.position.x + 150 : 0;
            const newY = lastNode ? lastNode.position.y : 0;

            const newNode = {
                id: noteData.id || Date.now().toString(),
                type: 'note',
                data: { title: noteData.title, directoryPath: noteData.path, connectionCount: 0 },
                position: { x: newX, y: newY },
                selected: true,
            };
            setTimeout(() => setCenter(newX + 30, newY + 30, { zoom: 1.2, duration: 1000 }), 50);
            return nds.map(n => ({ ...n, selected: false })).concat([newNode]);
        });
        setIsSelectorOpen(false);
    }, [setNodes, setCenter]);

    const handleDeleteElements = useCallback(() => {
        const selectedNodes = nodes.filter((node) => node.selected);
        if (selectedNodes.length === 0) return;
        setDeleteMessage(selectedNodes.length === 1 ? `정말 '${selectedNodes[0].data.title}' 노드를 삭제하시겠습니까?` : `정말 ${selectedNodes.length}개의 노드를 삭제하시겠습니까?`);
        setIsDeleteModalOpen(true);
    }, [nodes]);

    const executeDelete = useCallback(() => {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
        setIsDeleteModalOpen(false);
    }, [setNodes, setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (isConnectMode) {
            if (!connectSource) {
                setConnectSource(node);
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
            } else {
                if (connectSource.id === node.id) { setConnectSource(null); return; }
                const { sourceHandle, targetHandle } = getSmartHandlePosition(connectSource, node);
                onConnect({ source: connectSource.id, target: node.id, sourceHandle, targetHandle });
                setConnectSource(null);
            }
            return;
        }
        if (isDisconnectMode) {
            if (!disconnectSource) {
                setDisconnectSource(node);
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
            } else {
                const targetEdge = edges.find(e => (e.source === disconnectSource.id && e.target === node.id) || (e.source === node.id && e.target === disconnectSource.id));
                if (targetEdge) setEdges(eds => eds.filter(e => e.id !== targetEdge.id));
                setDisconnectSource(null);
            }
            return;
        }
        setCenter(node.position.x + 30, node.position.y + 30, { zoom: 1.2, duration: 1000 });
    }, [isConnectMode, connectSource, isDisconnectMode, disconnectSource, edges, setCenter, setNodes, onConnect, getSmartHandlePosition]);

    const handleAutoAlign = useCallback(() => {
        const GRID_SIZE = 50;
        setNodes((nds) => {
            const alignedNodes = nds.map((node) => ({
                ...node,
                position: { x: Math.round(node.position.x / GRID_SIZE) * GRID_SIZE, y: Math.round(node.position.y / GRID_SIZE) * GRID_SIZE }
            }));
            return alignedNodes;
        });
    }, [setNodes]);

    return (
        <div className="page-content-container mindmap-page">
            <main className="mindmap-canvas-area" style={{ position: 'relative', height: '100%' }}>
                <div className={`mode-label-top-left ${isEditMode ? 'edit' : 'view'}`}>
                    <span className="mode-dot" />
                    {isEditMode ? 'EDIT MODE' : 'READ MODE'}
                </div>

                {isEditMode && (
                    <MindmapToolbar
                        onAdd={() => setIsSelectorOpen(true)}
                        onDelete={handleDeleteElements}
                        onToggleConnectMode={() => { setIsConnectMode(!isConnectMode); setIsDisconnectMode(false); setConnectSource(null); }}
                        isConnectMode={isConnectMode}
                        onToggleDisconnectMode={() => { setIsDisconnectMode(!isDisconnectMode); setIsConnectMode(false); setDisconnectSource(null); }}
                        isDisconnectMode={isDisconnectMode}
                        onAlign={handleAutoAlign}
                        isEditMode={isEditMode}
                    />
                )}

                <div className="floating-top-right">
                    <button
                        className={`action-btn ${isEditMode ? 'btn-save' : 'btn-edit'}`}
                        onClick={() => setIsEditMode(!isEditMode)}
                        title={isEditMode ? '저장' : '편집'}
                    >
                        {isEditMode ? <Save size={20} /> : <Edit size={20} />}
                    </button>
                </div>

                <MindmapCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeUpdate={(old, next) => setEdges((els) => updateEdge(old, next, els))}
                    onNodeClick={onNodeClick}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDrag={handleNodeDrag}
                    onNodeDragStop={onNodeDragStop}
                    isEditMode={isEditMode}
                />

                <NodeSelectorModal isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} onSelect={handleSelectNote} />
                <ConfirmModal isOpen={isDeleteModalOpen} message={deleteMessage} onConfirm={executeDelete} onCancel={() => setIsDeleteModalOpen(false)} />
                <ConfirmModal isOpen={isSwapModalOpen} message="방향을 반대로 변경하시겠습니까?" onConfirm={handleConfirmSwap} onCancel={() => setIsSwapModalOpen(false)} />
                <ToastNotification message={toastMessage} isVisible={isToastVisible} onClose={closeToast} />
            </main>
        </div>
    );
};

const MindMap: React.FC = () => (
    <ReactFlowProvider>
        <MindMapContent />
    </ReactFlowProvider>
);

export default MindMap;