import React from 'react';
import './MindmapCommonButton.css';

interface MindmapCommonButtonProps {
    icon: React.ReactNode;   // 버튼 안에 들어갈 아이콘 (문자열 또는 컴포넌트)
    label: string;          // 버튼 이름 (툴팁 제목)
    description?: string;   // 툴팁 상세 설명
    onClick: () => void;    // 버튼 클릭 시 실행될 기능
    isActive?: boolean;     // 현재 활성화 상태인지 여부 (Amber 포인트 적용)
    isDanger?: boolean;     // 위험 액션(삭제 등)인지 여부 (Red 포인트 적용)
}


import { Tooltip } from '../tooltip/Tooltip';

/**
 * 마인드맵 툴바 전용 공통 버튼 컴포넌트
 * Theme.css의 변수를 사용하여 라이트/다크 모드에 대응합니다.
 */
export const MindmapCommonButton: React.FC<MindmapCommonButtonProps> = ({
    icon,
    label,
    description,
    onClick,
    isActive = false,
    isDanger = false
}) => {
    return (
        <Tooltip title={label} content={description} placement="right">
            <button
                type="button"
                className={`mindmap-common-button ${isActive ? 'active' : ''} ${isDanger ? 'danger' : ''}`}
                onClick={onClick}
                aria-label={label}
            >
                <div className="btn-icon-container">
                    {icon}
                </div>
            </button>
        </Tooltip>
    );
};