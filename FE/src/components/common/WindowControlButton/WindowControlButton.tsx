import React from 'react';
import './WindowControlButton.css';

/**
 * WindowControlButton Component
 * common 레이어에 해당하며, 일렉트론 창 제어(닫기, 최소화, 최대화)를 담당합니다.
 * macOS Traffic Light 스타일의 디자인을 따릅니다.
 */
const WindowControlButton: React.FC = () => {
    // preload.mjs를 통해 노출된 electronAPI 호출
    const handleClose = () => (window as any).electronAPI?.close();
    const handleMinimize = () => (window as any).electronAPI?.minimize();
    const handleMaximize = () => (window as any).electronAPI?.maximize();

    return (
        <div className="window-control-zone">
            <button
                className="control-btn close"
                onClick={handleClose}
                title="닫기"
            />
            <button
                className="control-btn minimize"
                onClick={handleMinimize}
                title="최소화"
            />
            <button
                className="control-btn maximize"
                onClick={handleMaximize}
                title="최대화"
            />
        </div>
    );
};

export default WindowControlButton;