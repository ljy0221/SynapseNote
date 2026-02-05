import React, { memo } from 'react';

interface HexagonBackgroundProps {
    color: string;
    level: number; // 1 to 5
    isShared?: boolean; // [New] 공유 상태
}

/**
 * 5단계로 겹쳐지는 육각형 배경 컴포넌트
 * Level 1: 단일 육각형
 * Level 5: 5겹 육각형
 */
const HexagonBackground: React.FC<HexagonBackgroundProps> = ({ color, level, isShared }) => {
    // 육각형 경로 생성 함수 (중심점 50, 50 기준)
    // r: 반지름 (크기)
    const createHexagonPath = (r: number) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30; // 30도 회전하여 뾰족한 부분이 위로 오게 함 (또는 0도)
            // 여기서는 Flat-topped (평평한 위) 또는 Pointy-topped (뾰족한 위) 중 선택
            // -30도는 Pointy-topped (뾰족한게 위)
            const angle_rad = (Math.PI / 180) * angle_deg;
            const x = 50 + r * Math.cos(angle_rad);
            const y = 50 + r * Math.sin(angle_rad);
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    };

    // 레벨에 따라 렌더링할 레이어 결정
    // Level 1: 가장 큰 외곽선 하나 (또는 꽉 찬 하나)
    // 아이콘이 60px 이므로, SVG viewBox="0 0 100 100" 에서 반지름 45 정도가 적당

    // 디자인 전략:
    // Level이 올라갈수록 "안쪽"에 육각형이 추가되는 방식? 아니면 "바깥쪽"으로 퍼지나?
    // "막이 두꺼워지는" 느낌이라면 겹겹이 쌓이는게 좋음.
    // 가장 바깥쪽은 항상 고정 크기여야 레이아웃이 안 깨짐.

    // Layer 1 (Base): r=45
    // Layer 2: r=38
    // Layer 3: r=31
    // Layer 4: r=24
    // Layer 5: r=17

    // 렌더링할 레이어 수 (최대 5개)
    // level=1 -> Main Only
    // level=5 -> Main + 4 inner rings

    const layers = [];
    const maxRadius = 50; // 48 -> 50 (꽉 채우기)
    const gap = 6; // 간격

    // 바깥쪽부터 안쪽으로 그림 (stroke만 사용)

    // [Base Layer] 테마별 배경색 채우기 (Solid, CSS 변수 사용)
    layers.push(
        <polygon
            key="base"
            points={createHexagonPath(maxRadius)}
            className="hexagon-base-layer"
            fill="#ffffff" // CSS 로드 실패 시 검정색 방지용 (Default White)
            stroke="none"
        />
    );

    for (let i = 0; i < level; i++) {
        const r = maxRadius - (i * gap);
        if (r < 5) break; // 너무 작으면 생략

        layers.push(
            <polygon
                key={i}
                points={createHexagonPath(r)}
                fill="none"
                stroke={(isShared && i === 0) ? "var(--node-shared-border)" : color} // 공유일 때는 가장 바깥쪽만 테마 색상 적용
                strokeWidth={i === 0 ? (isShared ? 4 : 3) : 1.5} // 공유면 태두리 조금 더 두껍게
                strokeDasharray={isShared && i === 0 ? "8, 6" : "none"} // 공유면 가장 바깥쪽 점선
                strokeLinecap="round" // 점선 끝을 둥글게
                strokeOpacity={1 - (i * 0.15)} // 안쪽으로 갈수록 연하게? 
                style={{ transition: 'all 0.3s ease' }}
            />
        );
    }

    return (
        <svg
            viewBox="0 0 100 100"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // 클릭 통과
                zIndex: -1, // 컨텐츠 뒤로
                overflow: 'visible' // 그림자 잘림 방지
            }}
        >
            {/* Glow Filter (선택 시 사용 가능하지만 성능 고려해 CSS box-shadow 대체 가능) */}
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* 배경을 살짝 어둡게 깔아줘서 텍스트/아이콘 가독성 확보 (선택사항) */}
            {/* <polygon points={createHexagonPath(maxRadius)} fill="var(--color-main)" fillOpacity="0.8" /> */}

            {layers}
        </svg>
    );
};

export default memo(HexagonBackground);
