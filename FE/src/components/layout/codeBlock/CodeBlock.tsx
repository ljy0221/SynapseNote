import React, { useState, useEffect, useRef } from 'react';
import VersionButton from '../../common/versionButton/VersionButton';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton';
import BlockDeleteButton from '../../common/blockDeleteButton/BlockDeleteButton';
import type { Language, ExecutionResult, ExecutionMode, SessionInfo, SessionExecutionResult } from '../../../types/execution/ExecutionTypes';
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
    const [result, setResult] = useState<SessionExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editedCode, setEditedCode] = useState(code);
    const [language, setLanguage] = useState<Language>(initialLanguage);

    // NEW: 세션 모드 상태
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('single');
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

    // textarea 높이 조절용 Ref
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 2. 코드가 변경될 때마다 높이 자동 조절
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [editedCode]);

    // NEW: 컴포넌트 마운트 시 세션 상태 로드
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

    // 3. 코드 실행 (API 연동) - 세션 모드 지원
    const handleRun = async () => {
        // Session 모드에서 noteId 필수 검증
        if (executionMode === 'session' && !noteId) {
            alert('세션 모드는 노트를 저장한 후에만 사용할 수 있습니다.');
            setExecutionMode('single');
            return;
        }

        setLoading(true);
        try {
            const executionResult = await window.dockerAPI.execute({
                blockId: id.toString(),
                language,
                version: getDefaultVersion(language),
                code: editedCode,
                mode: executionMode, // NEW: 모드 전달
                noteId: noteId, // NEW: noteId 전달
            });
            setResult(executionResult);

            // NEW: 세션 정보 업데이트
            if (executionMode === 'session' && noteId) {
                const info = await window.dockerAPI.getSessionStatus(noteId, language);
                setSessionInfo(info);
            }

            // 백엔드에 히스토리 저장
            if (noteId) {
                saveExecutionToBackend(noteId, id.toString(), executionResult).catch(console.error);
            }
        } catch (error: any) {
            const errorResult: SessionExecutionResult = {
                blockId: id.toString(),
                output: '',
                error: error.message || '알 수 없는 오류가 발생했습니다.',
                executionTime: 0,
                exitCode: -1,
                status: 'error',
                sessionId: null,
                isSessionActive: false,
            };
            setResult(errorResult);

            if (noteId) {
                saveExecutionToBackend(noteId, id.toString(), errorResult).catch(console.error);
            }
        } finally {
            setLoading(false);
        }
    };

    // NEW: 세션 종료
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

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <LanguageSelector
                    value={language}
                    onChange={setLanguage}
                    disabled={loading}
                />

                {/* NEW: 모드 선택 (Java 제외) */}
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
                            onClick={() => {
                                // noteId 있을 때만 모드 변경
                                if (noteId) {
                                    setExecutionMode('session');
                                }
                            }}
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
                    <BlockRunButton onClick={handleRun} disabled={loading} />

                    {/* NEW: 세션 인디케이터 */}
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
                        {executionMode === 'session' && ' [SESSION]'}
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