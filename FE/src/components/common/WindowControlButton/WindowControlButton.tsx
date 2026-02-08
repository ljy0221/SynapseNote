import React from 'react';
import './WindowControlButton.css';
import { isMac } from '../../../utils/detectOS';

/**
 * WindowControlButton Component
 * common 레이어에 해당하며, 일렉트론 창 제어(최소화, 최대화, 닫기)를 담당합니다.
 * 디자인은 macOS Traffic Light 스타일을 따르되, 순서는 윈도우 표준을 따릅니다.
 */
const WindowControlButton: React.FC = () => {
    // preload.mjs를 통해 노출된 electronAPI 호출
    const handleClose = () => (window as any).electronAPI?.close();
    const handleMinimize = () => (window as any).electronAPI?.minimize();
    const handleMaximize = () => (window as any).electronAPI?.maximize();

    // Mac에서는 OS 자체 버튼을 사용하므로 숨김 처리
    if (isMac()) {
        return null;
    }

    return (
        <div className="window-control-zone">
            {/* 최소화 (노랑) */}
            <button
                className="control-btn minimize"
                onClick={handleMinimize}
                title="최소화"
            />
            {/* 최대화 (초록) */}
            <button
                className="control-btn maximize"
                onClick={handleMaximize}
                title="최대화"
            />
            {/* 닫기 (빨강) */}
            <button
                className="control-btn close"
                onClick={handleClose}
                title="닫기"
            />
        </div>
    );
};

export default WindowControlButton;