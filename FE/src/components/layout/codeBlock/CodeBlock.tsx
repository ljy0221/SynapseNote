import React, { useState, useEffect, useRef } from 'react';
import VersionButton from '../../common/versionButton/VersionButton';
import { DragControls } from 'framer-motion';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton';

import CodeMirrorEditor from '../../common/codeMirrorEditor/CodeMirrorEditor';
import type { Language, ExecutionResult, ExecutionMode, SessionInfo } from '../../../types/execution/ExecutionTypes';
import { Server, RectangleEllipsis } from 'lucide-react';
import { BlockBookmarkButton } from '../../common/blockBookmarkButton/BlockBookmarkButton';
import './CodeBlock.css';
import { saveExecutionToBackend } from "../../../utils/executionAPI.ts";
import { LanguageSelector } from "./LanguageSelector.tsx";
import CheckpointSidebar from '../checkpoint/CheckpointSidebar';
import AiReviewButton from '../../common/aiReviewButton/AiReviewButton';
import { requestCodeReview, createReviewRequest } from '../../../api/ai/AiCodeReview.api';
import { formatReviewAsHtml } from '../../../utils/aiReviewFormatter';
import { getLanguageTemplate, isCodeEmpty } from '../../../utils/languageTemplates';
import { useCodeEditorStore } from '../../../store/useCodeEditorStore';
import { useToastStore } from '../../../store/useToastStore';
import { Tooltip } from '../../common/tooltip/Tooltip';

interface CodeBlockProps {
    id: number | string;
    language: Language;
    code: string;
    bookmark?: boolean;
    noteId?: string;
    onDelete: (id: number | string) => void;
    onChange: (id: number | string, newCode: string) => void;
    onFocus: () => void;
    onAddBlockAfter?: (content: string) => void; // AI 리뷰 결과를 새 블록으로 추가
    onToggleBookmark?: () => void;
    // Native DnD removed
    // Framer Motion controls
    dragControls?: DragControls;
    isFocused?: boolean; // [추가]
    onContextMenu?: (e: React.MouseEvent) => void; // [New]
    onAiReviewResult?: (htmlContent: string) => void;
    onLanguageChange?: (id: number | string, language: string) => void;
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
    onDelete: _onDelete,
    onChange,
    onFocus,
    onAddBlockAfter,
    dragControls,
    onContextMenu, // [New]
    onAiReviewResult, // [New]
    onLanguageChange,
    isFocused,
    bookmark = false,
    onToggleBookmark,
}) => {
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editedCode, setEditedCode] = useState(code);
    const { settings, getNoteLanguage, setNoteLanguage, trackBlockLanguage } = useCodeEditorStore();

    // Optimize selector to prevent re-renders and log spam
    const hasMultiple = useCodeEditorStore(state => {
        if (!noteId) return false;
        const noteBlocks = state.noteBlockLanguages[noteId];
        if (!noteBlocks) return false;
        const langs = new Set(Object.values(noteBlocks));
        return langs.size > 1;
    });

    const savedLanguage = noteId ? getNoteLanguage(noteId) : undefined;
    const [language, setLanguage] = useState<Language>(savedLanguage || initialLanguage);
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('single');
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [showCheckpoints, setShowCheckpoints] = useState(false);

    // AI 리뷰 관련 상태
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const aiReviewAbortRef = useRef<AbortController | null>(null);

    const handleBookmark = () => {
        onToggleBookmark?.();
    };

    // 🔥 초기화만 마운트 시 1회 수행 (원격 업데이트는 Yjs가 직접 처리)
    useEffect(() => {
        console.log(`[CodeBlock] Mount - ID: ${id}`);
        if (isCodeEmpty(code) && isCodeEmpty(editedCode)) {
            console.log(`[CodeBlock] Empty code detect - ID: ${id}, applying template`);
            const template = getLanguageTemplate(language);
            setEditedCode(template);
            onChange(id, template);
        }
        return () => console.log(`[CodeBlock] Unmount - ID: ${id}`);
    }, []);

    useEffect(() => {
        if (noteId && language !== 'java') {
            window.dockerAPI.getSessionStatus(noteId, language)
                .then(info => {
                    if (info) {
                        setSessionInfo(info);
                        setExecutionMode('session');
                    }
                }).catch(console.error);
        }
    }, [noteId, language]);

    useEffect(() => {
        if (noteId) {
            console.log(`[CodeBlock] useEffect Triggered - ID: ${id}, NoteID: ${noteId}, Lang: ${language}`);
            trackBlockLanguage(noteId, id.toString(), language);
        }
    }, [noteId, id, language]);

    const { showToast } = useToastStore();

    useEffect(() => {
        return () => aiReviewAbortRef.current?.abort();
    }, []);

    const handleCopy = () => {
        if (typeof editedCode === "string") navigator.clipboard.writeText(editedCode);
        showToast('코드가 클립보드에 복사되었습니다.', 'success');
    };

    const handleRun = async () => {
        if (executionMode === 'session' && !noteId) {
            alert('세션 모드는 노트를 저장한 후에만 사용할 수 있습니다.');
            setExecutionMode('single');
            return;
        }
        setLoading(true);
        try {
            const executionResult = executionMode === 'single'
                ? await window.dockerAPI.executeSingle({
                    blockId: id.toString(),
                    language,
                    version: getDefaultVersion(language),
                    code: editedCode,
                    timeout: settings.executionTimeout,
                })
                : await window.dockerAPI.execute({
                    blockId: id.toString(),
                    language,
                    version: getDefaultVersion(language),
                    code: editedCode,
                    mode: executionMode,
                    noteId: noteId,
                    timeout: settings.executionTimeout,
                });
            setResult(executionResult);
            if (executionMode === 'session' && noteId) {
                const info = await window.dockerAPI.getSessionStatus(noteId, language);
                setSessionInfo(info);
            }
            if (noteId) saveExecutionToBackend(noteId, id.toString(), executionResult).catch(console.error);
        } catch (error: any) {
            const errorResult: ExecutionResult = {
                blockId: id.toString(), output: '',
                error: error.message || '알 수 없는 오류가 발생했습니다.',
                executionTime: 0, exitCode: -1, status: 'error',
            };
            setResult(errorResult);
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
            alert('세션 종료 실패: ' + error.message);
        }
    };

    const handleLanguageChange = (newLanguage: Language) => {
        if (isCodeEmpty(editedCode)) {
            const template = getLanguageTemplate(newLanguage);
            setEditedCode(template);
            onChange(id, template);
            setLanguage(newLanguage);
            if (noteId) setNoteLanguage(noteId, newLanguage);
            if (onLanguageChange) onLanguageChange(id, newLanguage);
            return;
        }
        if (window.confirm('언어를 변경하면 기본 템플릿이 적용됩니다. 계속하시겠습니까?')) {
            const template = getLanguageTemplate(newLanguage);
            setEditedCode(template);
            onChange(id, template);
        }
        setLanguage(newLanguage);
        if (noteId) setNoteLanguage(noteId, newLanguage);
        if (onLanguageChange) onLanguageChange(id, newLanguage);
    };

    const handleRestore = (code: string) => {
        setEditedCode(code);
        onChange(id, code);
    };

    // [핵심 수정] AI 리뷰 핸들러: 저장 후 요청, 결과 부모 전달
    const handleAiReview = async () => {
        if (!noteId) return;

        aiReviewAbortRef.current?.abort();
        aiReviewAbortRef.current = new AbortController();
        setAiReviewLoading(true);

        try {
            // 1. 현재 편집된 코드와 언어를 백엔드에 즉시 동기화 (언어 미반영 문제 해결)
            await saveExecutionToBackend(noteId, id.toString(), {
                blockId: id.toString(),
                status: 'success',
                output: editedCode,
                executionTime: 0,
                exitCode: 0
            } as any);

            // 2. AI 리뷰 API 호출 (현재 선택된 언어 전달)
            const response = await requestCodeReview(
                noteId,
                id.toString(),
                createReviewRequest(language, editedCode as string),
                aiReviewAbortRef.current.signal
            );

            // 3. 리뷰 결과를 HTML로 변환하여 새 블록으로 추가 또는 기존 블록 업데이트
            if (onAiReviewResult) {
                const htmlContent = formatReviewAsHtml(response);
                onAiReviewResult(htmlContent);
            } else if (onAddBlockAfter) {
                const htmlContent = formatReviewAsHtml(response);
                onAddBlockAfter(htmlContent);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                alert(error.message || 'AI 리뷰 요청에 실패했습니다.');
            }
        } finally {
            setAiReviewLoading(false);
        }
    };

    return (
        <div
            id={id.toString()}
            className={`code-block-wrapper ${isFocused ? 'is-focused' : ''} ${bookmark ? 'is-bookmarked' : ''}`}
            onContextMenu={onContextMenu}
        >
            <div className="block-controls">
                <div
                    className="code-drag-handle"
                    onPointerDown={(e) => dragControls?.start(e)}
                    style={{ touchAction: 'none' }}
                    title="드래그하여 이동"
                >
                    ⋮⋮
                </div>
            </div>

            <div className="code-block-main">
                <div className="code-block-header">
                    <div className="code-left-controls"></div>
                    <LanguageSelector
                        value={language}
                        onChange={handleLanguageChange}
                        disabled={loading}
                    />

                    {(() => {
                        const isJava = language === 'java';
                        // Selector inside render is bad, but we are inside a map.
                        // Better to use the hook at top level.
                        const shouldShow = !isJava && !hasMultiple;
                        return shouldShow;
                    })() && (
                            <div className="mode-selector" style={{ marginLeft: '10px', display: 'flex', gap: '5px' }}>
                                <Tooltip title="단일 실행 모드" placement="top">
                                    <button
                                        className={`code-action-btn mode-button ${executionMode === 'single' ? 'active' : ''}`}
                                        onClick={() => setExecutionMode('single')}
                                        disabled={loading}
                                    >
                                        <RectangleEllipsis size={16} />
                                    </button>
                                </Tooltip>
                                <Tooltip title={!noteId ? '노트 저장 후 사용 가능' : '세션 실행 모드'} placement="top">
                                    <button
                                        className={`code-action-btn mode-button ${executionMode === 'session' ? 'active' : ''}`}
                                        onClick={() => {
                                            if (noteId) {
                                                setExecutionMode('session');
                                            }
                                        }}
                                        disabled={loading || !noteId}
                                    >
                                        <Server size={16} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}

                    <div className="code-actions">
                        {sessionInfo && executionMode === 'session' && (
                            <Tooltip title="세션 종료" placement="top">
                                <button
                                    className="session-indicator"
                                    onClick={handleTerminateSession}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        marginRight: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }}></span>
                                    {sessionInfo.sessionId.substring(0, 8)}
                                </button>
                            </Tooltip>
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
                        <AiReviewButton
                            onClick={handleAiReview}
                            disabled={loading}
                            loading={aiReviewLoading}
                            disabledReason={!noteId ? '노트를 저장해야 사용할 수 있습니다' : undefined}
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
                        minHeight="auto"
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

            {/* 즐겨찾기 버튼 (블록 외부 우측) */}
            <div className="block-actions-right">
                <BlockBookmarkButton isBookmarked={bookmark} onClick={handleBookmark} />
            </div>

        </div>
    );
};

export default CodeBlock;