/* src/components/layout/codeBlock/CodeBlock.tsx */
import React, { useState, useEffect } from 'react';
import VersionButton from '../../common/versionButton/VersionButton';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton';
import BlockDeleteButton from '../../common/blockDeleteButton/BlockDeleteButton';
import CodeMirrorEditor from '../../common/codeMirrorEditor/CodeMirrorEditor';
import type { Language, ExecutionResult, ExecutionMode, SessionInfo } from '../../../types/execution/ExecutionTypes';
import './CodeBlock.css';
import { saveExecutionToBackend } from "../../../utils/executionAPI.ts";
import { LanguageSelector } from "./LanguageSelector.tsx";
import CheckpointSidebar from '../checkpoint/CheckpointSidebar';
import { getLanguageTemplate, isCodeEmpty } from '../../../utils/languageTemplates';
import { useCodeEditorStore } from '../../../store/useCodeEditorStore';

interface CodeBlockProps {
    id: number | string;
    language: Language;
    code: string;
    noteId?: string;
    onDelete: (id: number | string) => void;
    onChange: (id: number | string, newCode: string) => void;
    onFocus: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    isFocused?: boolean; // [추가]
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
    onDrop,
}) => {
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editedCode, setEditedCode] = useState(code);

    // Zustand store에서 언어 설정 가져오기
    const { settings, getNoteLanguage, setNoteLanguage, trackBlockLanguage, hasMultipleLanguages } = useCodeEditorStore();

    // 저장된 언어 설정 로드 (noteId가 있을 때만)
    const savedLanguage = noteId ? getNoteLanguage(noteId) : undefined;
    const [language, setLanguage] = useState<Language>(savedLanguage || initialLanguage);

    // 세션 모드 상태 (feat/#63 추가)
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('single');
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

    // 버전 관리(체크포인트) 상태
    const [showCheckpoints, setShowCheckpoints] = useState(false);

    // props code 변경 시 editedCode 동기화
    useEffect(() => {
        if (code !== undefined) {
            setEditedCode(code);
        }
    }, [code]);

    // Debugging logs
    useEffect(() => {
        console.log('CodeBlock editedCode updated:', editedCode);
    }, [editedCode]);

    // CodeMirror가 자체적으로 포커스 및 높이를 관리하므로 ref와 useEffect 제거

    // 세션 상태 로드 (feat/#63 추가)
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
        // 세션 모드 검증 (feat/#63 추가)
        if (executionMode === 'session' && !noteId) {
            alert('세션 모드는 노트를 저장한 후에만 사용할 수 있습니다.');
            setExecutionMode('single');
            return;
        }

        setLoading(true);
        try {
            // 세션 모드 지원으로 변경 (feat/#63 수정)
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

            // 세션 정보 업데이트 (feat/#63 추가)
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

    // 세션 종료 (feat/#63 추가)
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

    // Tab 키는 CodeMirror 내장 기능으로 처리됨

    // 버전 복구 핸들러
    const handleRestore = (code: string) => {
        setEditedCode(code);
        onChange(id, code);
    };

    return (
        <div
            className="code-block-wrapper"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div className="code-block-header">
                {/* [좌측] 삭제 버튼 + 드래그 핸들 (호버 시 보임) */}
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
                {/* [중앙] 언어 선택기 */}
                <LanguageSelector
                    value={language}
                    onChange={setLanguage}
                    disabled={loading}
                />

                {/* 모드 선택 버튼 (feat/#63 추가 - Java 제외) */}
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

                {/* [우측] 액션 버튼들 (삭제 버튼 제거됨) */}
                <div className="code-actions">
                    {/* 세션 인디케이터 (feat/#63 추가) */}
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
                    <VersionButton
                        onClick={() => {
                            if (!noteId) {
                                alert('노트가 저장되어야 버전 관리를 사용할 수 있습니다.');
                                return;
                            }
                            setShowCheckpoints(true);
                        }}
                    />
                </div>
            </div>
            {/* 메인 코드 영역 */}
            <div className="code-content-container">
                <CodeMirrorEditor
                    value={editedCode}
                    language={language}
                    onChange={(value) => {
                        setEditedCode(value);
                        onChange(id, value);
                    }}
                    onFocus={onFocus}
                    readOnly={loading}
                    minHeight="150px"
                    maxHeight="800px"
                />
            </div>
            {/* 결과 출력 영역 */}
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

            {/* 버전 관리 사이드바 */}
            {showCheckpoints && noteId && (
                <CheckpointSidebar
                    noteId={noteId}
                    blockId={id.toString()}
                    currentCode={editedCode}
                    onClose={() => setShowCheckpoints(false)}
                    onRestore={handleRestore}
                />
            )}
        </div>
    );
};

export default CodeBlock;
