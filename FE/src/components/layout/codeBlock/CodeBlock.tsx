import React, { useState } from 'react';
import VersionButton from '../../common/versionButton/VersionButton.tsx';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton.tsx';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton.tsx';
import BlockDeleteButton from '../../common/blockDeleteButton/BlockDeleteButton';
import './CodeBlock.css';

interface CodeBlockProps {
    id: number; // 삭제를 위해 id가 필요합니다.
    language: string;
    code: string;
    onDelete: (id: number) => void; // 삭제 함수 추가
}

const CodeBlock: React.FC<CodeBlockProps> = ({ id, language, code, onDelete }) => {
    // 1. 실행 결과 상태 관리
    const [output, setOutput] = useState<string | null>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        alert('코드가 클립보드에 복사되었습니다.');
    };

    // 2. 실행 버튼 클릭 시 호출
    const handleRun = () => {
        // 실제 실행 대신 목업 데이터를 세팅 (추후 API 연결 가능)
        setOutput("120"); 
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-lang-badge">{language}</span>
                <div className="code-actions">
                    <BlockRunButton onClick={handleRun} />
                    <BlockCopyButton onCopy={handleCopy} />
                    <VersionButton onClick={() => console.log("버전 관리 실행")} />
                    <BlockDeleteButton onDelete={() => onDelete(id)} />
                </div>
            </div>

            {/* 메인 코드 영역 */}
            <div className="code-content-container">
                <pre className="code-content-view">
                    <code>{code}</code>
                </pre>
            </div>

            {/* 3. Output 영역 (결과가 있을 때만 표시) */}
            {output && (
                <div className="code-output-zone">
                    <div className="output-divider"></div>
                    <p className="output-label">OUTPUT</p>
                    <div className="output-content">
                        {output}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;