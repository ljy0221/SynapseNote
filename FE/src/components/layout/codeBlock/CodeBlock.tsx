import React, { useState } from 'react';
import VersionButton from '../../common/versionButton/VersionButton.tsx';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton.tsx';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton.tsx';
import BlockDeleteButton from '../../common/blockDeleteButton/BlockDeleteButton';
import { LanguageSelector } from './LanguageSelector';
import type { Language, ExecutionResult } from '../../../types/execution/ExecutionTypes';
import { saveExecutionToBackend } from '../../../utils/executionAPI';
import './CodeBlock.css';

interface CodeBlockProps {
    id: number; // 삭제를 위해 id가 필요합니다.
    language: Language;
    code: string;
    noteId?: string; // 백엔드 히스토리 저장용 (선택적)
    onDelete: (id: number) => void; // 삭제 함수 추가
    onChange: (id: number, newCode: string) => void; // 텍스트 수정을 위한 prop 추가
}

function getDefaultVersion(language: Language): string {
  switch (language) {
    case 'python': return '3.11';
    case 'javascript': return '20';
    case 'java': return '17';
    default: return '';
  }
}

const CodeBlock: React.FC<CodeBlockProps> = ({ id, language: initialLanguage, code, noteId, onDelete, onChange }) => {
    // 1. 실행 결과 상태 관리
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editedCode, setEditedCode] = useState(code);
    const [language, setLanguage] = useState<Language>(initialLanguage);

    const handleCopy = () => {
        navigator.clipboard.writeText(editedCode);
        alert('코드가 클립보드에 복사되었습니다.');
    };

    // 2. 실행 버튼 클릭 시 호출
    const handleRun = async () => {
        setLoading(true);
        try {
            const executionResult = await window.dockerAPI.executeSingle({
                blockId: id.toString(),
                language,
                version: getDefaultVersion(language),
                code: editedCode,
            });
            setResult(executionResult);

            // 백엔드에 히스토리 저장 (비동기, 에러 무시)
            if (noteId) {
                saveExecutionToBackend(noteId, id.toString(), executionResult).catch(console.error);
            }
        } catch (error: any) {
            const errorResult: ExecutionResult = {
                blockId: id.toString(),
                output: '',
                error: error.message || '알 수 없는 오류가 발생했습니다.',
                executionTime: 0,
                exitCode: -1,
                status: 'error',
            };
            setResult(errorResult);

            // 에러도 히스토리에 저장
            if (noteId) {
                saveExecutionToBackend(noteId, id.toString(), errorResult).catch(console.error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <LanguageSelector
                    value={language}
                    onChange={setLanguage}
                    disabled={loading}
                />
                <div className="code-actions">
                    <BlockRunButton onClick={handleRun} disabled={loading} />
                    <BlockCopyButton onCopy={handleCopy} />
                    <VersionButton onClick={() => console.log("버전 관리 실행")} />
                    <BlockDeleteButton onDelete={() => onDelete(id)} />
                </div>
            </div>

            {/* 메인 코드 영역 */}
            <div className="code-content-container">
                <textarea
                    className="code-editor-input"
                    value={editedCode}
                    onChange={(e) => {
                        setEditedCode(e.target.value);
                        onChange(id, e.target.value);
                    }}
                    placeholder="// 새로운 코드를 작성하세요."
                    spellCheck="false"
                    disabled={loading}
                />
            </div>

            {/* 3. Output 영역 (결과가 있을 때만 표시) */}
            {result && (
                <div className="code-output-zone">
                    <div className="output-divider"></div>
                    <p className="output-label">
                        OUTPUT ({result.status.toUpperCase()}) - {result.executionTime}ms
                    </p>
                    <pre className="output-content">
                        {result.status === 'success' ? result.output : result.error}
                    </pre>
                </div>
            )}

            {/* 로딩 상태 표시 */}
            {loading && (
                <div className="code-output-zone">
                    <p className="output-label">실행 중...</p>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;