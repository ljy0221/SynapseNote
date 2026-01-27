import { useEffect, useRef, useCallback } from 'react';
import { Node } from 'reactflow';
import { forceSimulation, SimulationNodeDatum } from 'd3-force';

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
            .force('collide', alpha => {
                const nodes = simulationRef.current?.nodes() as SimNode[];
                if (!nodes) return;

                // 직사각형 충돌 감지 및 해결 (강도 상수)
                const STRENGTH = 0.5;
                const PADDING = 10; // 여유 공간

                for (let i = 0; i < nodes.length; ++i) {
                    for (let j = i + 1; j < nodes.length; ++j) {
                        const a = nodes[i];
                        const b = nodes[j];

                        // [Modified] 드래그 중인 노드를 포함하면 물리 처리 안함
                        if (dragNodeRef.current === a.id || dragNodeRef.current === b.id) continue;

                        const ax = a.x + a.vx! * alpha; // 예측 위치 포함
                        const ay = a.y + a.vy! * alpha;
                        const bx = b.x + b.vx! * alpha;
                        const by = b.y + b.vy! * alpha;

                        const dx = bx - ax;
                        const dy = by - ay;
                        const adx = Math.abs(dx);
                        const ady = Math.abs(dy);

                        // 각 노드의 반값 너비/높이
                        const aw = (a.width || 150) / 2 + PADDING;
                        const ah = (a.height || 50) / 2 + PADDING;
                        const bw = (b.width || 150) / 2 + PADDING;
                        const bh = (b.height || 50) / 2 + PADDING;

                        // 충돌 검사 (직사각형)
                        if (adx < (aw + bw) && ady < (ah + bh)) {
                            // 충돌 발생! 가장 적게 겹치는 축으로 밀어내기
                            const overlapX = (aw + bw) - adx;
                            const overlapY = (ah + bh) - ady;

                            // X축으로 밀어내는 게 더 유리한가, Y축인가? (작은 쪽 선택)
                            if (overlapX < overlapY) {
                                const sign = dx > 0 ? 1 : -1;
                                const move = overlapX * STRENGTH * alpha;
                                a.vx! -= move * sign;
                                b.vx! += move * sign;
                            } else {
                                const sign = dy > 0 ? 1 : -1;
                                const move = overlapY * STRENGTH * alpha;
                                a.vy! -= move * sign;
                                b.vy! += move * sign;
                            }
                        }
                    }
                }
            })
            .velocityDecay(0.6);

        simulationRef.current.on('tick', () => {
            // [Modified] 드래그 중일 때는 물리 엔진 업데이트를 아예 중단하여 다른 노드가 움직이는 것을 방지
            if (dragNodeRef.current) return;

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

        // [Modified] 드래그 중일 때는 리액트 상태 변경이 물리 엔진을 재시작하지 않도록 차단
        if (dragNodeRef.current) return;


        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        const currentSimNodes = simulationRef.current.nodes() as SimNode[];

        // 노드 개수가 변했거나 ID가 바뀐 경우에만 전체 동기화 진행 (성능 최적화)
        // 단순 위치 변경은 드래그 상황이 아니면 물리엔진이 위치를 결정하므로 무시 가능하나,
        // 외부 요인(예: 정렬 버튼)으로 위치가 바뀔 수도 있으므로 전체 동기화 유지하되 드래그만 예외처리

        const newSimNodes = nodes.map(node => {
            const existing = currentSimNodes.find(n => n.id === node.id);
            return {
                ...existing, // 기존 물리 상태(속도 등) 보존
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                width: node.width || 150,
                height: node.height || 50,
                // 드래그 중이거나 World Boundary인 경우 고정
                fx: (node.id === 'world-boundary') ? node.position.x : undefined,
                fy: (node.id === 'world-boundary') ? node.position.y : undefined,
            };
        });

        simulationRef.current.nodes(newSimNodes);

        // [Modified] 노드 위치가 변경되어도 물리 엔진을 재시작하지 않음 (정적 배치 유지)
        // 오직 드래그(manual)나 명시적 호출에 의해서만 위치가 변하도록 함
        // simulationRef.current.alpha(0.3).restart();

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
            //simulationRef.current.alpha(0.3).restart();
        }
    }, []);

    const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
        // [Modified] 드래그 시 좌표 제한 로직 추가
        // 다른 노드와 겹치려고 하면 해당 위치로 못 가게 막음 (벽돌처럼)

        let newX = node.position.x;
        let newY = node.position.y;

        const PADDING = 10;

        // 현재 드래그 중인 노드의 크기
        const w = node.width || 150;
        const h = node.height || 50;
        const aw = w / 2 + PADDING;
        const ah = h / 2 + PADDING;

        // 다른 모든 노드와 충돌 검사
        nodes.forEach(other => {
            if (other.id === node.id || other.id === 'world-boundary') return;

            const bw = (other.width || 150) / 2 + PADDING;
            const bh = (other.height || 50) / 2 + PADDING;

            const dx = other.position.x - newX;
            const dy = other.position.y - newY;
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);

            if (adx < (aw + bw) && ady < (ah + bh)) {
                // 충돌! 겹치는 깊이 계산
                const overlapX = (aw + bw) - adx;
                const overlapY = (ah + bh) - ady;

                // 더 얕게 겹친 쪽으로 밀어내기 (위치 보정)
                if (overlapX < overlapY) {
                    if (dx > 0) newX -= overlapX; // 타겟이 오른쪽 -> 왼쪽으로 밀림
                    else newX += overlapX;        // 타겟이 왼쪽 -> 오른쪽으로 밀림
                } else {
                    if (dy > 0) newY -= overlapY; // 타겟이 아래 -> 위로 밀림
                    else newY += overlapY;        // 타겟이 위 -> 아래로 밀림
                }
            }
        });

        // 보정된 위치를 물리 엔진에 반영
        if (simulationRef.current) {
            const simNode = simulationRef.current.nodes().find((n: SimNode) => n.id === node.id);
            if (simNode) {
                simNode.fx = newX;
                simNode.fy = newY;

                // 만약 실제로 위치가 보정되었다면, React Flow 노드 상태도 업데이트해야 
                // 화면상에서 '걸리는' 느낌을 줄 수 있음. 
                // 하지만 onNodeDrag에서 setNodes를 호출하면 렌더링 루프 위험이 있으므로,
                // 여기서는 물리 엔진 좌표만 업데이트하고 React Flow의 드래그 자체를 막지는 않음.
                // (React Flow는 드래그 중인 노드의 UI 위치를 내부적으로 관리함)

                // *중요*: "못 위치하는 느낌"을 주려면 위치를 강제로 덮어써야 함.
                if (newX !== node.position.x || newY !== node.position.y) {
                    node.position.x = newX;
                    node.position.y = newY;
                }
            }
            // [Modified] 드래그 중 시뮬레이션 재시작 하지 않음
            // simulationRef.current.alpha(0.3).restart();
        }
    }, [nodes]);

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
            // [Modified] 드래그 종료 시에도 시뮬레이션 재시작 하지 않음 (정적 배치 유지)
            // simulationRef.current.alpha(0.3).restart();
        }
    }, []);

    return { onNodeDragStart, onNodeDrag, onNodeDragStop };
};
