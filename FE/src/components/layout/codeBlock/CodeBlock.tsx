import React, { useState, useEffect, useRef } from 'react';
import VersionButton from '../../common/versionButton/VersionButton';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton';
import BlockDeleteButton from '../../common/blockDeleteButton/BlockDeleteButton';
import type { Language, ExecutionResult, ExecutionMode, SessionInfo } from '../../../types/execution/ExecutionTypes';
import './CodeBlock.css';
import { saveExecutionToBackend } from "../../../utils/executionAPI.ts";
import { LanguageSelector } from "./LanguageSelector.tsx";

interface CodeBlockProps {
    id: number;
    language: Language;
    code: string;
    noteId?: string;
    onDelete: (id: number) => void;
    onChange: (id: number, newCode: string) => void;
    onFocus: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

function getDefaultVersion(language: Language): string {
    switch (language) {
        case 'python': return '3.11';
        case 'javascript': return '20';
        case 'java': return '17';
        default: return '';
    }
}

const CodeBlock: React.FC<CodeBlockProps> = ({
                                                 id,
                                                 language: initialLanguage,
                                                 code,
                                                 noteId,
                                                 onDelete,
                                                 onChange,
                                                 onFocus,
                                                 draggable,
                                                 onDragStart,
                                                 onDragOver,
                                                 onDrop
                                             }) => {
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editedCode, setEditedCode] = useState(code);
    const [language, setLanguage] = useState<Language>(initialLanguage);

    // 세션 모드 상태 (feat/#63)
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('single');
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 텍스트 영역 높이 자동 조절
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [editedCode]);

    // 세션 상태 로드 (feat/#63)
    useEffect(() => {
        if (noteId && language !== 'java') {
            window.dockerAPI.getSessionStatus(noteId, language)
                .then(info => {
                    if (info) {
                        setSessionInfo(info);
                        setExecutionMode('session');
                    }
                })
                .catch(console.error);
        }
    }, [noteId, language]);

    const handleCopy = () => {
        if (typeof editedCode === "string") {
            navigator.clipboard.writeText(editedCode);
        }
        alert('코드가 클립보드에 복사되었습니다.');
    };

    const handleRun = async () => {
        if (executionMode === 'session' && !noteId) {
            alert('세션 모드는 노트를 저장한 후에만 사용할 수 있습니다.');
            setExecutionMode('single');
            return;
        }

        setLoading(true);
        try {
            // 실행 모드(Single/Session)에 따른 API 호출 구분
            const executionResult = executionMode === 'single'
                ? await window.dockerAPI.executeSingle({
                    blockId: id.toString(),
                    language,
                    version: getDefaultVersion(language),
                    code: editedCode,
                })
                : await window.dockerAPI.execute({
                    blockId: id.toString(),
                    language,
                    version: getDefaultVersion(language),
                    code: editedCode,
                    mode: executionMode,
                    noteId: noteId,
                });

            setResult(executionResult);

            if (executionMode === 'session' && noteId) {
                const info = await window.dockerAPI.getSessionStatus(noteId, language);
                setSessionInfo(info);
            }

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

    const handleTerminateSession = async () => {
        if (!noteId) return;
        try {
            await window.dockerAPI.destroySession(noteId, language);
            setSessionInfo(null);
            setExecutionMode('single');
            alert('세션이 종료되었습니다.');
        } catch (error: any) {
            console.error('Failed to terminate session:', error);
            alert('세션 종료 실패: ' + error.message);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = editedCode.substring(0, start) + '\t' + editedCode.substring(end);
            setEditedCode(newValue);
            onChange(id, newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
        }
    };

    return (
        <div
            className="code-block-wrapper"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div className="code-block-header">
                <div className="code-left-controls">
                    <BlockDeleteButton onDelete={() => onDelete(id)} />
                    <div
                        className="code-drag-handle"
                        draggable={draggable}
                        onDragStart={onDragStart}
                        title="드래그하여 이동"
                    >
                        ⋮⋮
                    </div>
                </div>

                <LanguageSelector
                    value={language}
                    onChange={setLanguage}
                    disabled={loading}
                />

                {language !== 'java' && (
                    <div className="mode-selector" style={{ marginLeft: '10px', display: 'flex', gap: '5px' }}>
                        <button
                            className={`mode-button ${executionMode === 'single' ? 'active' : ''}`}
                            onClick={() => setExecutionMode('single')}
                            disabled={loading}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                backgroundColor: executionMode === 'single' ? '#4A90E2' : '#555',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                            }}
                        >
                            Single
                        </button>
                        <button
                            className={`mode-button ${executionMode === 'session' ? 'active' : ''}`}
                            onClick={() => noteId && setExecutionMode('session')}
                            disabled={loading || !noteId}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: (loading || !noteId) ? 'not-allowed' : 'pointer',
                                backgroundColor: executionMode === 'session' ? '#4A90E2' : '#555',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                opacity: !noteId ? 0.5 : 1,
                            }}
                            title={!noteId ? '노트를 저장해야 세션 모드를 사용할 수 있습니다' : '세션 모드 활성화'}
                        >
                            Session
                        </button>
                    </div>
                )}

                <div className="code-actions">
                    {sessionInfo && executionMode === 'session' && (
                        <button
                            className="session-indicator"
                            onClick={handleTerminateSession}
                            title="세션 종료"
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                marginRight: '5px',
                            }}
                        >
                            🟢 Session: {sessionInfo.sessionId.substring(0, 8)}
                        </button>
                    )}

                    <BlockRunButton onClick={handleRun} disabled={loading} />
                    <BlockCopyButton onCopy={handleCopy} />
                    <VersionButton onClick={() => console.log("버전 관리 실행")} />
                </div>
            </div>

            <div className="code-content-container">
                <textarea
                    ref={textareaRef}
                    className="code-editor-input"
                    value={editedCode}
                    onChange={(e) => {
                        setEditedCode(e.target.value);
                        onChange(id, e.target.value);
                    }}
                    onFocus={onFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="// 새로운 코드를 작성하세요."
                    spellCheck="false"
                    disabled={loading}
                    style={{ overflow: 'hidden' }}
                />
            </div>

            {result && (
                <div className="code-output-zone">
                    <div className="output-divider"></div>
                    <p className="output-label">
                        OUTPUT ({result.status.toUpperCase()}) - {result.executionTime}ms
                        {executionMode === 'session' && ' [SESSION]'}
                    </p>
                    <pre className="output-content">
                        {result.status === 'success' ? result.output : result.error}
                    </pre>
                </div>
            )}

            {loading && (
                <div className="code-output-zone">
                    <p className="output-label">실행 중...</p>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;