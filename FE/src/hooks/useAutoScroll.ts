import { useEffect, useRef } from 'react';

interface AutoScrollOptions {
    margin?: number; // 감지 영역 (px)
    maxSpeed?: number; // 최대 스크롤 속도
}

export const useAutoScroll = (
    scrollContainerRef: React.RefObject<HTMLElement>,
    options: AutoScrollOptions = {}
) => {
    const { margin = 100, maxSpeed = 30 } = options;
    const scrollInterval = useRef<number | null>(null);
    const mouseY = useRef<number>(0);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { top, bottom, height } = container.getBoundingClientRect();
        const y = mouseY.current;

        // 컨테이너 내부 좌표 계산
        const relativeY = y - top;

        let scrollAmount = 0;

        // 상단 감지
        if (relativeY < margin) {
            // 가장자리에 가까울수록 빨라짐
            const intensity = (margin - relativeY) / margin;
            scrollAmount = -maxSpeed * intensity;
        }
        // 하단 감지
        else if (relativeY > height - margin) {
            const intensity = (relativeY - (height - margin)) / margin;
            scrollAmount = maxSpeed * intensity;
        }

        if (scrollAmount !== 0) {
            container.scrollTop += scrollAmount;
            scrollInterval.current = requestAnimationFrame(checkScroll);
        } else {
            scrollInterval.current = null;
        }
    };

    const handleDragOver = (e: React.DragEvent | DragEvent) => {
        mouseY.current = e.clientY;

        if (!scrollInterval.current) {
            scrollInterval.current = requestAnimationFrame(checkScroll);
        }
    };

    const handleDragEnd = () => {
        if (scrollInterval.current) {
            cancelAnimationFrame(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    return { handleDragOver, handleDragEnd };
};
