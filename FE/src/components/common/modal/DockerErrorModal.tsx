import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import './DockerErrorModal.css';

interface DockerErrorModalProps {
    isOpen: boolean;
    type: 'installed' | 'running' | null;
    onRetry: () => void;
    onClose: () => void;
}

export const DockerErrorModal: React.FC<DockerErrorModalProps> = ({ isOpen, type, onRetry, onClose }) => {
    if (!isOpen || !type) return null;

    const isInstalledError = type === 'installed';

    return (
        <div className="docker-error-modal-overlay">
            <div className="docker-error-modal-content">
                {/* 
                  필수적인 경고이므로 닫기 버튼은 선택적으로 제공하거나 제거할 수 있음.
                  여기서는 사용자가 인지하고 닫을 수 있도록 우측 상단 닫기 버튼 제공
                */}
                <button className="withdrawal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={`docker-error-header ${isInstalledError ? 'error-installed' : 'error-running'}`}>
                    <AlertTriangle className="docker-error-icon" size={48} />
                    <h2 className="docker-error-title">
                        {isInstalledError ? 'Docker가 설치되지 않았습니다' : 'Docker가 실행되지 않았습니다'}
                    </h2>
                </div>

                <div className="docker-error-description">
                    {isInstalledError ? (
                        <>
                            Docker Desktop이 설치되어 있지 않습니다.<br />
                            원활한 앱 사용을 위해 Docker Desktop을 설치해주세요.<br />
                            <br />
                            <a
                                href="https://www.docker.com/products/docker-desktop/"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                    // Electron에서 외부 링크 열기 지원 (필요 시 ipcRenderer 사용)
                                    // 현재는 기본 a 태그 동작에 의존하거나 Window.open 사용
                                }}
                            >
                                Docker Desktop 다운로드 바로가기
                            </a>
                        </>
                    ) : (
                        <>
                            Docker Desktop이 실행 중이지 않습니다.<br />
                            백그라운드에서 Docker를 실행한 후<br />
                            다시 시도해주세요.
                        </>
                    )}
                </div>

                <div className="docker-error-actions">
                    <button className="btn-close-docker" onClick={onClose}>
                        닫기
                    </button>
                    <button className="btn-retry-docker" onClick={onRetry}>
                        {isInstalledError ? (
                            <>
                                <RefreshCw size={18} /> 확인
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} /> 재시도
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
