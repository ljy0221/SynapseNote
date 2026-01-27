
import { useCallback, useRef } from 'react';
import { Node, useReactFlow } from 'reactflow';

// 노드 기본 크기 (스타일과 일치해야 함)
const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 50;
const BUFFER = 10; // 여유 공간 (충돌 감지 시 약간의 간격 유지)

interface UseNodeRepulsionProps {
    // nodes와 setNodes는 이제 내부에서 가져오거나 선택적으로 사용
    active?: boolean;
}

export const useNodeRepulsion = ({ active = true }: UseNodeRepulsionProps = {}) => {
    const { getNodes, setNodes } = useReactFlow();
    // 마지막으로 유효했던 위치를 저장 (충돌 시 되돌리기 위함)
    const lastValidPos = useRef<{ x: number; y: number } | null>(null);

    // 드래그 시작 시 현재 위치 유효성 확인
    const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
        if (!active) return;
        lastValidPos.current = { x: node.position.x, y: node.position.y };
    }, [active]);

    // 드래그 중 충돌 실시간 감지
    // nodes 의존성을 제거하고 getNodes() 사용
    const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
        if (!active) return;

        const currentNodes = getNodes();

        // 현재 드래그 중인 노드의 예상 범위 (AABB)
        const nodeW = node.width || DEFAULT_WIDTH;
        const nodeH = node.height || DEFAULT_HEIGHT;

        const rectA = {
            left: node.position.x,
            right: node.position.x + nodeW,
            top: node.position.y,
            bottom: node.position.y + nodeH
        };

        // 다른 모든 노드와 충돌 검사
        const hasCollision = currentNodes.some(otherNode => {
            if (otherNode.id === node.id || otherNode.id === 'world-boundary') return false;

            const otherW = otherNode.width || DEFAULT_WIDTH;
            const otherH = otherNode.height || DEFAULT_HEIGHT;

            const rectB = {
                left: otherNode.position.x - BUFFER,
                right: otherNode.position.x + otherW + BUFFER,
                top: otherNode.position.y - BUFFER,
                bottom: otherNode.position.y + otherH + BUFFER
            };

            // AABB 교차 검사
            return (
                rectA.left < rectB.right &&
                rectA.right > rectB.left &&
                rectA.top < rectB.bottom &&
                rectA.bottom > rectB.top
            );
        });

        if (hasCollision) {
            // 충돌 발생 시: 위치 업데이트를 막고 이전 유효 위치로 강제 복귀
            if (lastValidPos.current) {
                // 직접 위치 수정 (React Flow 내부 상태 보정)
                // React Flow 내부 상태를 강제로 되돌리기 위해 setNodes 호출
                // 주의: onNodeDrag에서 setNodes를 빈번하게 호출하면 성능 이슈가 있을 수 있으나,
                // 충돌 시에만 호출하므로 시도해봄.

                // 다만, React Flow의 Drag 동작은 내부적으로 DOM을 이동시키므로
                // 여기서 setNodes만으로는 시각적인 "벽에 막히는 느낌"을 완벽히 주기 어려울 수 있음.
                // 완벽한 구현을 위해서는 reactflow의 onNodeDrag에서 position을 직접 수정해서 리턴하거나 
                // nodeExtent를 동적으로 계산해야 하지만 복잡함.

                // 차선책: 그냥 위치를 업데이트하지 않음 (React Flow State에는 반영안됨)
                // 하지만 시각적으로는 마우스를 따라가다가 놓았을 때 튕겨져 나갈 수 있음.

                // 여기서는, 충돌 시 position을 업데이트 하는 로직이 아니라
                // "유효한 위치일 때만 lastValidPos를 갱신" 하는 방식으로 접근.

                // 진짜 막으려면 node.position을 강제로 lastValidPos로 덮어써야 함.
                node.position.x = lastValidPos.current.x;
                node.position.y = lastValidPos.current.y;
            }
        } else {
            // 충돌이 없으면 현재 위치를 유효한 위치로 저장
            lastValidPos.current = { x: node.position.x, y: node.position.y };
        }
    }, [active, getNodes]);

    const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
        if (!active) return;

        // 드래그 종료 시 최종 위치가 충돌 상태라면 (드래그가 너무 빨라서 뚫고 들어간 경우)
        // 마지막 유효 위치로 강제 이동
        if (lastValidPos.current) {
            // 충돌 상태로 끝났을 경우를 대비해 안전하게 위치 동기화
            setNodes((nds) => nds.map(n => {
                if (n.id === node.id && lastValidPos.current) {
                    return {
                        ...n,
                        position: {
                            x: lastValidPos.current.x,
                            y: lastValidPos.current.y
                        }
                    };
                }
                return n;
            }));
        }

        lastValidPos.current = null;
    }, [active, setNodes]);

    return { onNodeDragStart, onNodeDrag, onNodeDragStop };
};

