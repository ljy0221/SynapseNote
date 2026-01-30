import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    BackgroundVariant,
    SelectionMode,
    Connection, // 타입 추가
    useViewport // 줌 레벨 감지를 위한 훅
} from 'reactflow';
import 'reactflow/dist/style.css';

// 같은 폴더에 있는 NoteNode를 가져옵니다.
import NoteNode from './NoteNode';
import MindmapControls from './MindmapControls';

/**
 * MindmapCanvasProps 인터페이스
 * MindMap.tsx에서 전달받는 모든 타입 정의
 */
interface MindmapCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onEdgeUpdate?: (oldEdge: Edge, newConnection: Connection) => void;
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    onNodeDragStart?: (event: React.MouseEvent, node: Node) => void;
    onNodeDrag?: (event: React.MouseEvent, node: Node) => void;
    onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
    isEditMode: boolean;
}

/**
 * 줌 레벨에 따라 격자 간격이 변하는 배경 컴포넌트
 * (성능 최적화를 위해 별도 컴포넌트로 분리)
 */
const DynamicBackground: React.FC = () => {
    const { zoom } = useViewport();

    // 줌 레벨에 따른 격자 간격 계산
    // 줌이 작을수록(멀리 볼수록) 간격을 넓혀서 촘촘함을 방지
    const gap = useMemo(() => {
        if (zoom < 0.2) return 150; // 아주 멀리서 볼 때 (기존 100 -> 150)
        if (zoom < 0.5) return 80;  // 적당히 멀리서 볼 때 (기존 50 -> 80)
        if (zoom < 1.0) return 40;  // 기본 (기존 25 -> 40)
        return 30;                  // 가까이서 볼 때 (기존 20 -> 30)
    }, [zoom]);

    return (
        <Background
            variant={BackgroundVariant.Lines}
            gap={gap}
            size={1}
            color="var(--color-point)"
            style={{ opacity: 0.1, transition: 'gap 0.3s ease' }} // 부드러운 전환 효과 추가
        />
    );
};

/**
 * 마인드맵 캔버스 컴포넌트 (Feature)
 */
import { MAP_WIDTH, MAP_HEIGHT } from '../../../constants/mindmapConstants';

const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onEdgeUpdate,
    onNodeClick,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    isEditMode,
}) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [minZoom, setMinZoom] = React.useState(0.1);
    const MAX_ZOOM = 2.0;

    // 화면 크기에 따른 minZoom 동적 계산
    React.useEffect(() => {
        const updateMinZoom = () => {
            if (wrapperRef.current) {
                const { clientWidth, clientHeight } = wrapperRef.current;
                // 가로/세로 비율 중 더 많이 축소해야 하는 쪽을 기준으로 설정
                const widthRatio = clientWidth / MAP_WIDTH;
                const heightRatio = clientHeight / MAP_HEIGHT;
                const newMinZoom = Math.min(widthRatio, heightRatio); // 더 작은 비율 선택 (전체가 보이도록)

                // 너무 작아지는 것 방지 (선택사항, 필요 없다면 0에 가깝게 둬도 됨)
                // 여기서는 계산된 값을 그대로 사용
                setMinZoom(newMinZoom);
            }
        };

        // 초기 실행
        updateMinZoom();

        // 리사이즈 이벤트 등록
        window.addEventListener('resize', updateMinZoom);
        return () => window.removeEventListener('resize', updateMinZoom);
    }, []);

    /**
     * 커스텀 노드 타입 등록
     * 리렌더링 시 객체가 새로 생성되는 것을 방지하기 위해 useMemo를 사용합니다.
     */
    const nodeTypes = useMemo(() => ({
        note: NoteNode,
    }), []);

    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onNodeClick={onNodeClick} // 노드 클릭 핸들러 연결
                onNodeDragStart={onNodeDragStart}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                nodesDraggable={isEditMode}
                nodesConnectable={isEditMode} // 편집 모드일 때만 선 연결 가능
                proOptions={{ hideAttribution: true }}

                // 좌클릭 패닝 & Shift+드래그 선택 설정
                panOnDrag={[0, 1, 2]}
                selectionOnDrag={true}
                selectionKeyCode="Shift"
                panOnScroll={true}
                selectionMode={SelectionMode.Partial}

                // 이동 및 줌 제한 설정 (Boundary Node 크기와 일치)
                translateExtent={[[-4000, -3000], [4000, 3000]]}
                minZoom={minZoom}
                maxZoom={MAX_ZOOM}
            >
                {/* 배경 격자 설정: 줌에 따라 간격이 변하는 동적 배경 */}
                <DynamicBackground />

                {/* 캔버스 제어 도구 (줌, 핏뷰 등) - 커스텀 컴포넌트 사용 */}
                <MindmapControls minZoom={minZoom} maxZoom={MAX_ZOOM} />
            </ReactFlow>
        </div>
    );
};

export default MindmapCanvas;