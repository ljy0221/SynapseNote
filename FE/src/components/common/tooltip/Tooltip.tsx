import React, { useState } from 'react';
import './Tooltip.css';

interface TooltipProps {
    title?: string; // 툴팁 제목 (강조)
    content?: string; // 툴팁 내용 (설명)
    children: React.ReactNode;
    placement?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * 커스텀 툴팁 컴포넌트
 * 마우스 호버 시 툴팁을 표시합니다.
 */
export const Tooltip: React.FC<TooltipProps> = ({
    title,
    content,
    children,
    placement = 'right'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    // 내용이 없으면 굳이 렌더링하지 않음
    if (!title && !content) return <>{children}</>;

    return (
        <div
            className="tooltip-wrapper"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            <div className={`tooltip-container ${placement} ${isVisible ? 'visible' : ''}`}>
                {title && <span className="tooltip-title">{title}</span>}
                {content && <span className="tooltip-desc">{content}</span>}
            </div>
        </div>
    );
};
