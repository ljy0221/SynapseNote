import React from 'react';
import './ModalHeader.css';

interface ModalHeaderProps {
    onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => {
    return (
        <div className="modal-header-container">
            <div className="modal-header-controls">
                {/* 
                   메인 헤더와 통일감을 주기 위해 3개 버튼을 배치하되,
                   닫기 버튼만 기능을 활성화하고 나머지는 장식용(비활성)으로 둡니다.
                   순서는 윈도우/리눅스/맥 스타일에 따라 다르지만
                   WindowControlButton.tsx가 (최소-최대-닫기) 순서라면 여기도 맞출 수 있으나,
                   "닫기 버튼을 통일해달라"는 요청 상, 우측 상단에 위치하면서 
                   트래픽 라이트 스타일을 유지하는 것이 깔끔함.
                   
                   WindowControlButton.tsx: 최소(노랑), 최대(초록), 닫기(빨강) 순서 (윈도우/리눅스 배치에 맥 스타일?)
                   보통 맥은 좌측 상단 (닫기-최소-최대)
                   윈도우는 우측 상단 (최소-최대-닫기)
                   
                   여기서는 WindowControlButton.tsx와 동일한 순서(최소-최대-닫기)로 배치하여 통일감을 줍니다.
                */}
                <button className="modal-control-btn close" onClick={onClose} title="닫기" />
            </div>
        </div>
    );
};
