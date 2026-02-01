import React, { memo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { BaseEdge, EdgeProps, getBezierPath, useStore } from 'reactflow';

const THEME_PALETTES: Record<string, string[]> = {
    light: ['#a8a29e', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706'],
    cookie: ['#a8a29e', '#d97706', '#f59e0b', '#fbbf24', '#fde047'],
    dark: ['#525252', '#737373', '#a3a3a3', '#d4d4d4', '#ffffff'],
    deepblue: ['#64748b', '#3b82f6', '#0ea5e9', '#22d3ee', '#bae6fd']
};

const getLevelIndex = (count: number) => {
    if (count >= 10) return 4;
    if (count >= 7) return 3;
    if (count >= 4) return 2;
    if (count >= 2) return 1;
    return 0;
};

/**
 * SynapseEdge: 뇌신경(시냅스) 느낌의 커스텀 엣지
 * - 기본 경로: 반투명한 실선 (축삭돌기 느낌)
 * - 애니메이션: 경로를 따라 이동하는 빛나는 입자 (신경 전달 물질/전기 신호)
 */
const SynapseEdge: React.FC<EdgeProps> = ({
    id,
    source, // source node id
    target, // [Fix] target node id 추가
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}) => {
    // 1. Source & Target Node 데이터 가져오기
    const sourceNode = useStore((s) => s.nodeInternals.get(source));
    const targetNode = useStore((s) => s.nodeInternals.get(target));

    const sourceCount = sourceNode?.data?.connectionCount || 0;
    const targetCount = targetNode?.data?.connectionCount || 0;

    // 2. 테마 색상 결정 (Start -> End Gradient)
    // [Fix] Theme Reactivity: Context 사용
    const { themeMode } = useTheme();
    const currentPalette = THEME_PALETTES[themeMode] || THEME_PALETTES['light'];

    const sourceColor = currentPalette[getLevelIndex(sourceCount)];
    const targetColor = currentPalette[getLevelIndex(targetCount)];

    const gradientId = `edge-gradient-${id}`;

    // 3. Bezier 경로 계산
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            {/* Gradient Definition */}
            <defs>
                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
                    <stop offset="0%" stopColor={sourceColor} />
                    <stop offset="100%" stopColor={targetColor} />
                </linearGradient>
            </defs>

            {/* A. 기본 경로 (Base Path) - Gradient 적용 */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 3,
                    stroke: `url(#${gradientId})`, // 그라데이션 적용
                    opacity: 0.8, // 불투명도 약간 높임 (그라데이션 잘 보이게)
                }}
            />

            {/* A-2. 점선 장식 (Dotted Decoration) - Gradient 적용 */}
            <path
                d={edgePath}
                fill="none"
                stroke={`url(#${gradientId})`} // 그라데이션 적용
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="0 60"
                strokeOpacity={0.6}
                style={{ pointerEvents: 'none' }}
            />

            {/* B. 신호 애니메이션 (Signal Packet) - 출발지에서 도착지 색상으로 변화 */}
            <circle r="4" fill={sourceColor}>
                <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    path={edgePath}
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1"
                    keyTimes="0;1"
                />
                <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur="2.5s"
                    repeatCount="indefinite"
                />
                {/* [New] 색상 변화 애니메이션 (Source Color -> Target Color) */}
                <animate
                    attributeName="fill"
                    values={`${sourceColor};${targetColor}`}
                    dur="2.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1"
                />
            </circle>

            {/* C. 추가적인 장식 (선택사항) */}
        </>
    );
};

export default memo(SynapseEdge);
