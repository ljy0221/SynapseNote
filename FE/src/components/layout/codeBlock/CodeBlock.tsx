import React, { useState, useEffect, useRef } from 'react';
import VersionButton from '../../common/versionButton/VersionButton';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton';
import BlockDeleteButton from '../../common/blockDeleteButton/BlockDeleteButton';
import type { Language, ExecutionResult } from '../../../types/execution/ExecutionTypes';
// import { saveExecutionToBackend } from '../../../utils/executionAPI';
import './CodeBlock.css';
import {saveExecutionToBackend} from "../../../utils/executionAPI.ts";
import {LanguageSelector} from "./LanguageSelector.tsx";

interface CodeBlockProps {
    id: number;
    language: Language;
    code: string;
    noteId?: string; // 백엔드 히스토리 저장용
    onDelete: (id: number) => void;
    onChange: (id: number, newCode: string) => void;
}

// 헬퍼 함수: 언어별 기본 버전 설정
function getDefaultVersion(language: Language): string {
    switch (language) {
        case 'python': return '3.11';
        case 'javascript': return '20';
        case 'java': return '17';
        default: return '';
    }
}

const CodeBlock: React.FC<CodeBlockProps> = ({ id, language: initialLanguage, code, noteId, onDelete, onChange }) => {
    // 1. 상태 관리
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editedCode, setEditedCode] = useState(code);
    const [language, setLanguage] = useState<Language>(initialLanguage);

    // textarea 높이 조절용 Ref
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 2. 코드가 변경될 때마다 높이 자동 조절
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [editedCode]);

    const handleCopy = () => {
        if (typeof editedCode === "string") {
            navigator.clipboard.writeText(editedCode);
        }
        alert('코드가 클립보드에 복사되었습니다.');
    };

    // 3. 코드 실행 (API 연동)
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

            // 백엔드에 히스토리 저장
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
                    ref={textareaRef}
                    className="code-editor-input"
                    value={editedCode}
                    onChange={(e) => {
                        setEditedCode(e.target.value);
                        onChange(id, e.target.value); // 부모 컴포넌트에도 변경 알림
                    }}
                    placeholder="// 새로운 코드를 작성하세요."
                    spellCheck="false"
                    disabled={loading}
                    style={{ overflow: 'hidden' }}
                />
            </div>

            {/* 결과 출력 영역 (result가 있을 때만 표시) */}
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

            {/* 로딩 표시 */}
            {loading && (
                <div className="code-output-zone">
                    <p className="output-label">실행 중...</p>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;