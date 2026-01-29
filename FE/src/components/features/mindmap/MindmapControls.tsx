import React, { useState } from 'react';
import { useReactFlow, Panel } from 'reactflow';
import { Plus, Minus, Maximize, BoxSelect } from 'lucide-react';
import '../../../pages/mindmap/MindMap.css'; // 버튼 스타일 재사용
import { Tooltip } from '../../common/tooltip/Tooltip';

// MindmapControls.tsx

interface MindmapControlsProps {
    minZoom: number;
    maxZoom: number;
}

const MindmapControls: React.FC<MindmapControlsProps> = ({ minZoom, maxZoom }) => {
    const { fitView, setCenter, getNodes, setNodes, getViewport, setViewport } = useReactFlow();
    const [isAllSelected, setIsAllSelected] = useState(false);

    // 줌 속도 배수 (1.2^3 ≒ 1.728 -> 약 1.8배로 설정하여 3배 효과 체감)
    const ZOOM_FACTOR = 1.8;

    /**
     * 커스텀 줌인 (중심 유지하며 3배 빠르게)
     */
    const handleFastZoomIn = () => {
        const { x, y, zoom } = getViewport();
        // maxZoom을 넘지 않도록 제한
        const newZoom = Math.min(zoom * ZOOM_FACTOR, maxZoom);

        if (newZoom === zoom) return; // 이미 최대치면 무시

        // 화상 중앙 좌표 유지 계산
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const newX = centerX - ((centerX - x) / zoom) * newZoom;
        const newY = centerY - ((centerY - y) / zoom) * newZoom;

        setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 500 });
    };

    /**
     * 커스텀 줌아웃 (중심 유지하며 3배 빠르게)
     */
    const handleFastZoomOut = () => {
        const { x, y, zoom } = getViewport();
        // minZoom보다 작아지지 않도록 제한
        const newZoom = Math.max(zoom / ZOOM_FACTOR, minZoom);

        if (newZoom === zoom) return; // 이미 최소치면 무시

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const newX = centerX - ((centerX - x) / zoom) * newZoom;
        const newY = centerY - ((centerY - y) / zoom) * newZoom;

        setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 500 });
    };

    /**
     * 스마트 화면 맞춤 핸들러
     * - 선택된 노드가 있으면: 해당 노드로 줌인 이동
     * - 선택된 노드가 없으면: 전체 화면 맞춤 (fitView)
     */
    const handleSmartFitView = () => {
        const nodes = getNodes();
        const selectedNode = nodes.find((n) => n.selected);

        if (selectedNode) {
            // 선택된 노드가 있으면 그 노드를 중심으로 이동 (Zoom 1.2)
            const targetX = selectedNode.position.x + 30; // center offset (approx)
            const targetY = selectedNode.position.y + 30;
            setCenter(targetX, targetY, { zoom: 1.2, duration: 800 });
        } else {
            // 없으면 전체 화면 맞춤
            fitView({ duration: 800, minZoom: minZoom, maxZoom: maxZoom });
        }
    };

    // 모든 노드 선택 토글 (제목 보기/숨기기)
    const handleSelectAll = () => {
        const nextState = !isAllSelected;
        setIsAllSelected(nextState);

        setNodes((nds) =>
            nds.map((node) => {
                // 경계선(Boundary) 노드는 선택하지 않음
                if (node.id === 'world-boundary') return node;
                return { ...node, selected: nextState };
            })
        );
    };

    return (
        <Panel position="bottom-left" className="mindmap-controls-panel">
            <div className="controls-group">
                <Tooltip title="빠른 확대 (+)" content="화면을 확대하여 더 자세히 봅니다." placement="right">
                    <button className="action-btn btn-control" onClick={handleFastZoomIn}>
                        <Plus size={20} />
                    </button>
                </Tooltip>
                <Tooltip title="빠른 축소 (-)" content="화면을 축소하여 전체적인 구조를 파악합니다." placement="right">
                    <button className="action-btn btn-control" onClick={handleFastZoomOut}>
                        <Minus size={20} />
                    </button>
                </Tooltip>
                <Tooltip title="화면 맞춤 / 선택 집중" content="선택한 시냅스에 집중하거나, 전체 마인드맵을 화면에 꽉 차게 맞춥니다." placement="right">
                    <button className="action-btn btn-control" onClick={handleSmartFitView}>
                        <Maximize size={20} />
                    </button>
                </Tooltip>
                <Tooltip title={isAllSelected ? "선택 해제" : "모두 선택"} content="모든 시냅스를 선택하여 제목을 한눈에 확인하거나 일괄 작업을 준비합니다." placement="right">
                    <button
                        className={`action-btn btn-control ${isAllSelected ? 'active' : ''}`}
                        onClick={handleSelectAll}
                        style={isAllSelected ? { backgroundColor: 'var(--color-sub)', color: 'var(--color-point)' } : {}}
                    >
                        <BoxSelect size={20} />
                    </button>
                </Tooltip>
            </div>
        </Panel>
    );
};

export default MindmapControls;
