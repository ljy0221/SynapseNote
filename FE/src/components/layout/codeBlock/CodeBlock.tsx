import React, { useState, useEffect, useRef } from 'react';
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
    onChange: (id: number, newCode: string) => void; // 텍스트 수정을 위한 prop 추가
}

const CodeBlock: React.FC<CodeBlockProps> = ({ id, language, code, onDelete, onChange }) => {
    // 1. 실행 결과 상태 관리
    const [output, setOutput] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // 3. 코드가 변경될 때마다 높이 자동 조절
    useEffect(() => {
        if (textareaRef.current) {
            // 높이 초기화 후 스크롤 높이만큼 재설정 (줄어들 때도 동작하도록)
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [code]); // code가 바뀔 때마다 실행


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
                <textarea
                    ref={textareaRef}
                    className="code-editor-input"
                    value={code} // id 대신 반드시 code(또는 content)가 와야 합니다.
                    onChange={(e) => onChange(id, e.target.value)}
                    placeholder="// 새로운 코드를 작성하세요."
                    spellCheck="false"
                    style={{ overflow: 'hidden' }}
                />
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