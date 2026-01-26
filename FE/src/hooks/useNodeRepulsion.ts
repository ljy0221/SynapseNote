import { useEffect, useRef, useCallback } from 'react';
import { Node } from 'reactflow';
import { forceSimulation, forceCollide, SimulationNodeDatum } from 'd3-force';

type SimNode = SimulationNodeDatum & {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

interface UseNodeRepulsionProps {
    nodes: Node[];
    setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
    active?: boolean;
}

export const useNodeRepulsion = ({ nodes, setNodes, active = true }: UseNodeRepulsionProps) => {
    const simulationRef = useRef<any>(null);
    const isInternalUpdate = useRef(false);

    // 드래그 중인 노드를 추적하여 물리 엔진에서 고정(fx, fy) 처리
    const dragNodeRef = useRef<string | null>(null);

    useEffect(() => {
        if (!active) return;

        simulationRef.current = forceSimulation<SimNode>([])
            .force('collide', forceCollide((d: SimNode) => {
                const w = d.width || 150;
                const h = d.height || 50;
                return Math.max(w, h) / 1.5;
            }).strength(0.7).iterations(1))
            .velocityDecay(0.6);

        simulationRef.current.on('tick', () => {
            const simNodes: SimNode[] = simulationRef.current.nodes();
            let hasChange = false;

            setNodes((prevNodes) => {
                const newNodes = prevNodes.map((node) => {
                    const simNode = simNodes.find(sn => sn.id === node.id);
                    if (!simNode || node.id === 'world-boundary') return node;

                    // *중요*: 드래그 중인 노드는 React Flow 위치를 물리 엔진이 덮어쓰지 않도록 함
                    if (dragNodeRef.current === node.id) return node;

                    const dx = Math.abs(node.position.x - simNode.x);
                    const dy = Math.abs(node.position.y - simNode.y);

                    if (dx > 0.5 || dy > 0.5) {
                        hasChange = true;
                        // 물리 엔진 좌표를 React Flow에 반영
                        return {
                            ...node,
                            position: { x: simNode.x, y: simNode.y }
                        };
                    }
                    return node;
                });

                if (hasChange) {
                    isInternalUpdate.current = true;
                    return newNodes;
                }
                return prevNodes;
            });
        });

        return () => {
            simulationRef.current.stop();
        };
    }, []);

    useEffect(() => {
        if (!active || !simulationRef.current) return;

        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        const currentSimNodes = simulationRef.current.nodes() as SimNode[];

        const newSimNodes = nodes.map(node => {
            const existing = currentSimNodes.find(n => n.id === node.id);
            return {
                ...existing,
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                width: node.width || 150,
                height: node.height || 50,
                // 드래그 중이거나 World Boundary인 경우 고정
                fx: (node.id === 'world-boundary' || dragNodeRef.current === node.id) ? node.position.x : undefined,
                fy: (node.id === 'world-boundary' || dragNodeRef.current === node.id) ? node.position.y : undefined,
            };
        });

        simulationRef.current.nodes(newSimNodes);
        simulationRef.current.alpha(0.3).restart();

    }, [nodes, active]);

    // 드래그 핸들러
    const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
        dragNodeRef.current = node.id;

        // 드래그 시작 시 해당 노드를 시뮬레이션에서 고정 (fx, fy 설정)
        if (simulationRef.current) {
            const simNode = simulationRef.current.nodes().find((n: SimNode) => n.id === node.id);
            if (simNode) {
                simNode.fx = node.position.x;
                simNode.fy = node.position.y;
            }
            simulationRef.current.alpha(0.3).restart();
        }
    }, []);

    const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
        // 드래그 중: 고정된 위치를 계속 업데이트하여 다른 노드를 밀어내도록 함
        if (simulationRef.current) {
            const simNode = simulationRef.current.nodes().find((n: SimNode) => n.id === node.id);
            if (simNode) {
                simNode.fx = node.position.x;
                simNode.fy = node.position.y;
            }
            simulationRef.current.alpha(0.3).restart();
        }
    }, []);

    const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
        dragNodeRef.current = null;

        // 드래그 종료 시 고정 해제 (원하는 위치에 안착했다면, 혹은 계속 밀어내길 원하면 fx, fy 유지할 수도 있음)
        // 여기서는 다시 물리 법칙을 따르도록 해제 (자연스럽게 정착)
        if (simulationRef.current) {
            const simNode = simulationRef.current.nodes().find((n: SimNode) => n.id === node.id);
            if (simNode) {
                simNode.fx = null;
                simNode.fy = null;
                // 단, 현재 위치는 유지해야 튀지 않음
                simNode.x = node.position.x;
                simNode.y = node.position.y;
            }
            simulationRef.current.alpha(0.3).restart();
        }
    }, []);

    return { onNodeDragStart, onNodeDrag, onNodeDragStop };
};
