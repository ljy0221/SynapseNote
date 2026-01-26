import React from 'react';
import VersionButton from '../../common/versionButton/VersionButton.tsx';
import './CodeBlock.css';

interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        alert('코드가 클립보드에 복사되었습니다.');
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-lang-badge">{language}</span>
                <div className="code-actions">
                    {/* ✅ 분리한 공통 컴포넌트 사용 */}
                    <VersionButton onClick={() => console.log("버전 관리 실행")} />
                </div>
            </div>
            <pre className="code-content-view">
                <code>{code}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;