import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, Atom, Share2, BrainCircuit, Globe, ArrowRightCircle } from 'lucide-react';
import './NoteNode.css';

/**
 * 노드 데이터 타입 정의
 */
export interface NoteNodeData {
    title: string;
    directoryPath?: string;
    connectionCount?: number; // 연결된 노드 개수
}

/**
 * 시냅스(Synapse) 스타일의 커스텀 노드 컴포넌트
 */
const NoteNode: React.FC<NodeProps<NoteNodeData>> = ({ data, selected, isConnectable }) => {
    // Fan-out에 따른 크기 조절
    const scale = Math.min(1 + (data.connectionCount || 0) * 0.2, 2);

    // Fan-out에 따른 테두리 색상 진화 (Heatmap Style)
    const getBorderColor = (count: number = 0) => {
        if (count >= 10) return 'var(--color-point)'; // Master (Gold/Amber)
        if (count >= 7) return '#a78bfa'; // High (Purple)
        if (count >= 4) return '#60a5fa'; // Mid (Blue)
        if (count >= 2) return '#4ade80'; // Low (Green)
        return '#a8a29e'; // Dormant (Visible Gray)
    };

    const borderColor = getBorderColor(data.connectionCount);

    // 읽기 모드일 때 핸들을 시각적으로만 숨김 (연결 유지)
    const handleStyle = {
        opacity: isConnectable ? 1 : 0,
        backgroundColor: borderColor, // 핸들 색상도 노드 테두리와 통일
        borderColor: 'var(--color-main)' // 핸들 테두리는 배경색으로 깔끔하게
    };

    // [New] 랜덤한 애니메이션 딜레이 생성 (컴포넌트 마운트 시 고정값으로 사용하기 위해 useMemo 권장되지만, 간단히 처리)
    const randomDelay = React.useMemo(() => `-${Math.random() * 2}s`, []);

    return (
        <div
            className={`note-node-container ${selected ? 'selected' : ''}`}
            style={{
                // transform: `scale(${scale})`, // CSS animation과 충돌 방지 위해 변수로 전달
                '--scale': scale,
                animationDelay: randomDelay, // 개별 노드마다 다른 타이밍
                transformOrigin: 'center',
                borderColor: borderColor, // 선택 여부와 관계없이 진화 단계 색상 유지
                boxShadow: selected ? `0 0 20px ${borderColor}` : undefined // 선택 시 해당 색상으로 빛나는 효과
            } as React.CSSProperties}
        >
            {/* Selected Tooltip (Speech Bubble) */}
            {selected && (
                <div
                    className="note-node-tooltip"
                    style={{ '--tooltip-bg': borderColor } as React.CSSProperties}
                >
                    <span className="tooltip-text">{data.title}</span>
                    <button
                        className="tooltip-nav-btn"
                        onClick={(e) => {
                            e.stopPropagation(); // 노드 선택 해제 방지
                            console.log(`Navigate to ${data.directoryPath}`);
                            // 추후 라우팅 로직 추가
                        }}
                        title="이 노트로 이동"
                    >
                        <ArrowRightCircle size={16} />
                    </button>
                    {/* 말풍선 꼬리 요소 (CSS로 처리되지만 명시적 구조가 필요할 경우) */}
                </div>
            )}

            {/* Top Handles */}
            <Handle type="target" position={Position.Top} id="top-t" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Top} id="top-s" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />

            {/* Right Handles */}
            <Handle type="target" position={Position.Right} id="right-t" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} id="right-s" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />

            {/* Bottom Handles */}
            <Handle type="target" position={Position.Bottom} id="bottom-t" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Bottom} id="bottom-s" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />

            {/* Left Handles */}
            <Handle type="target" position={Position.Left} id="left-t" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Left} id="left-s" className="note-node-handle" style={handleStyle} isConnectable={isConnectable} />

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
                    const iconProps = { size: 24, strokeWidth: 1.5, color: borderColor };

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