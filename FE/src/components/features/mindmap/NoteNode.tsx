import React from 'react';
import { useNavigate } from 'react-router-dom'; // [New]
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, Atom, Share2, BrainCircuit, Globe, ArrowRightCircle } from 'lucide-react';
import './NoteNode.css';

import { getNodeColorByConnectionCount } from '../../../utils/mindmapUtils';
import HexagonBackground from './HexagonBackground';

/**
 * 노드 데이터 타입 정의
 */
export interface NoteNodeData {
    title: string;
    directoryPath?: string;
    connectionCount?: number; // 연결된 노드 개수
    isShared?: boolean; // 공유 여부
}

/**
 * 시냅스(Synapse) 스타일의 커스텀 노드 컴포넌트
 */
const NoteNode: React.FC<NodeProps<NoteNodeData>> = ({ id, data, selected, isConnectable }) => {
    const navigate = useNavigate(); // [New]

    // Fan-out에 따른 크기 조절 (육각형이라 크기 조금 더 키워도 됨)
    const scale = Math.min(1 + (data.connectionCount || 0) * 0.1, 2);

    // Fan-out에 따른 색상
    const borderColor = getNodeColorByConnectionCount(data.connectionCount);

    // Fan-out 레벨 계산 (1~5단계)
    const getLevel = (count: number = 0) => {
        if (count >= 10) return 5;
        if (count >= 7) return 4;
        if (count >= 4) return 3;
        if (count >= 2) return 2;
        return 1;
    };
    const level = getLevel(data.connectionCount);

    // 읽기 모드일 때 핸들을 시각적으로만 숨김 (연결 유지)
    // [Request] 에디트 모드에서도 핸들 점(4개)을 시각적으로 숨김 (Click-to-Connect 방식 위주)
    const handleStyle = {
        opacity: 0, // 항상 안 보이게 숨김
        backgroundColor: borderColor,
        borderColor: 'var(--color-main)'
    };

    // [New] 랜덤한 애니메이션 딜레이 생성
    const randomDelay = React.useMemo(() => `-${Math.random() * 2}s`, []);

    // [Refactor] Predictable Tooltip Layout (Top-Right Fixed)
    // 기존의 랜덤 위치 방식은 데이터 변경 시 깜빡임/겹침 문제를 유발하므로 고정된 위치(Top-Right)로 개선합니다.
    const layout = React.useMemo(() => ({
        path: "M 35 2 V -20 L 60 -35",
        dotStart: { cx: 35, cy: 2 },
        dotEnd: { cx: 60, cy: -35 },
        style: { top: -35, left: 60, transform: 'translateY(-50%)' }
    }), []);

    return (
        <div
            className={`note-node-container ${selected ? 'selected' : ''} ${data.isShared ? 'shared' : ''}`}
            style={{
                '--scale': scale,
                animationDelay: randomDelay,
                transformOrigin: 'center',
            } as React.CSSProperties}
        >
            {/* [New] 육각형 배경 (SVG) */}
            <HexagonBackground color={borderColor} level={level} isShared={data.isShared} />

            {/* Selected Tooltip (Name Tag with Connector) */}
            {selected && (
                <>
                    {/* [New] Angled Connector Line (Synapse Style) */}
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            overflow: 'visible',
                            pointerEvents: 'none',
                            zIndex: 99
                        }}
                    >
                        <path
                            d={layout.path}
                            fill="none"
                            stroke={borderColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }}
                        />
                        {/* 연결 부위 장식 (Dot) */}
                        <circle cx={layout.dotStart.cx} cy={layout.dotStart.cy} r="3" fill={borderColor} />
                        <circle cx={layout.dotEnd.cx} cy={layout.dotEnd.cy} r="3" fill={borderColor} />
                    </svg>

                    <div
                        className="note-node-tooltip"
                        style={{
                            '--tooltip-bg': borderColor,
                            ...layout.style
                        } as React.CSSProperties}
                    >
                        <span className="tooltip-text">{data.title}</span>
                        <button
                            className="tooltip-nav-btn"
                            onClick={(e) => {
                                e.stopPropagation(); // 노드 선택 해제 방지
                                navigate(`/note/${id}`); // [New] 노트 페이지로 이동
                            }}
                            title="이 노트로 이동"
                        >
                            <ArrowRightCircle size={16} />
                        </button>
                    </div>
                </>
            )}

            {/* Top Handles - Pointy Top */}
            <Handle type="target" position={Position.Top} id="top-t" className="note-node-handle" style={{ ...handleStyle, top: '4px' }} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Top} id="top-s" className="note-node-handle" style={{ ...handleStyle, top: '4px' }} isConnectable={isConnectable} />

            {/* Right Handles - Flat Side */}
            <Handle type="target" position={Position.Right} id="right-t" className="note-node-handle" style={{ ...handleStyle, right: '10px' }} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} id="right-s" className="note-node-handle" style={{ ...handleStyle, right: '10px' }} isConnectable={isConnectable} />

            {/* Bottom Handles - Pointy Bottom */}
            <Handle type="target" position={Position.Bottom} id="bottom-t" className="note-node-handle" style={{ ...handleStyle, bottom: '4px' }} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Bottom} id="bottom-s" className="note-node-handle" style={{ ...handleStyle, bottom: '4px' }} isConnectable={isConnectable} />

            {/* Left Handles - Flat Side */}
            <Handle type="target" position={Position.Left} id="left-t" className="note-node-handle" style={{ ...handleStyle, left: '10px' }} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Left} id="left-s" className="note-node-handle" style={{ ...handleStyle, left: '10px' }} isConnectable={isConnectable} />

            <div className="note-node-content">
                {/* 
                    [Icon Evolution Logic]
                    Lv 1 (0-1): Atom (기본 단위)
                    Lv 2 (2-3): Share2 (연결 시작)
                    Lv 3 (4-6): BrainCircuit (회로 형성)
                    Lv 4 (7-9): Brain (지능 발현)
                    Lv 5 (10+): Globe (초지성 네트워크)
                */}
                {(() => {
                    const count = data.connectionCount || 0;
                    // 아이콘에도 동일한 색상 적용 (선택 시에도 색상 유지)
                    const iconProps = { size: 28, strokeWidth: 1.5, color: borderColor }; // 아이콘 크기 약간 증가

                    if (count >= 10) return <Globe {...iconProps} />;
                    if (count >= 7) return <Brain {...iconProps} />;
                    if (count >= 4) return <BrainCircuit {...iconProps} />;
                    if (count >= 2) return <Share2 {...iconProps} />;
                    return <Atom {...iconProps} />;
                })()}
            </div>
        </div>
    );
};

export default NoteNode;