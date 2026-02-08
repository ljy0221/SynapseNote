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
import ConfirmModal from '../../common/modal/ConfirmModal';
import AlertModal from '../../common/modal/AlertModal'; // [New]
import { BlockEditorAvatar } from '../../common/blockEditorAvatar/BlockEditorAvatar'; // [New]
import { AwarenessUser } from '../../../hooks/useYjsStore'; // [New]
import { useYjsStore } from '../../../hooks/useYjsStore'; // [New] Import hook for Y.Text access

interface CodeBlockProps {
    id: number | string;
    language: Language;
    code: string;
    bookmark?: boolean;
    noteId?: string;
    onDelete: (id: number | string) => void;
    onChange: (id: number | string, newCode: string) => void;
    onFocus: () => void;
    onBlur?: () => void; // [New] Clear awareness on blur
    onAddBlockAfter?: (content: string) => void; // AI 리뷰 결과를 새 블록으로 추가
    onToggleBookmark?: () => void;
    // Native DnD removed
    // Framer Motion controls
    dragControls?: DragControls;
    isFocused?: boolean; // [추가]
    onContextMenu?: (e: React.MouseEvent) => void; // [New]
    onAiReviewResult?: (htmlContent: string) => void;
    onLanguageChange?: (id: number | string, language: string) => void;
    readOnly?: boolean; // [New]
    showBookmark?: boolean; // [New]
    editors?: AwarenessUser[]; // [New] Users editing this block
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
    language, // [Fix] Use prop directly instead of renaming
    code,
    noteId,
    onDelete: _onDelete,
    onChange,
    onFocus,
    onBlur, // [New]
    onAddBlockAfter,
    onToggleBookmark,
    dragControls,
    isFocused,
    onContextMenu, // [New]
    onAiReviewResult, // [New]
    onLanguageChange,
    bookmark = false,
    readOnly = false, // [New]
    showBookmark = true, // [New]
    editors = [], // [New]
}) => {
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [loading, setLoading] = useState(false);
    // [REMOVED] editedCode state - Y.Text handles this now
    const { settings, setNoteLanguage, trackBlockLanguage } = useCodeEditorStore();

    // Optimize selector to prevent re-renders and log spam
    const hasMultiple = useCodeEditorStore(state => {
        if (!noteId) return false;
        const noteBlocks = state.noteBlockLanguages[noteId];
        if (!noteBlocks) return false;
        const langs = new Set(Object.values(noteBlocks));
        return langs.size > 1;
    });

    // [Fix] Use prop as source of truth for language (managed by Yjs)
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('single');
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [showCheckpoints, setShowCheckpoints] = useState(false);

    // [New] Language Change Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);

    // [New] AI Review Alert Modal State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // AI 리뷰 관련 상태
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const aiReviewAbortRef = useRef<AbortController | null>(null);

    // [New] Get Y.Text from Yjs store for collaborative editing
    const { getYTextForCodeBlock } = useYjsStore(noteId);
    const ytext = noteId ? getYTextForCodeBlock?.(id.toString()) : null;

    // [REMOVED] lastSentValueRef - not needed with Y.Text
    // [REMOVED] isEditorFocused tracking - Y.Text handles conflicts automatically

    // CodeBlock uses LWW (Last-Write-Wins) synchronization
    const handleBookmark = () => {
        onToggleBookmark?.();
    };

    // 🔥 초기화만 마운트 시 1회 수행
    useEffect(() => {
        // [New] With Y.Text, initialization is handled by Yjs store
        // Only set template if Y.Text is empty
        if (ytext && ytext.length === 0) {
            const template = getLanguageTemplate(language);
            ytext.insert(0, template);
        }
    }, [ytext]); // Run when ytext becomes available

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
        const currentCode = ytext ? ytext.toString() : code;
        if (typeof currentCode === "string") navigator.clipboard.writeText(currentCode);
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
                    code: ytext ? ytext.toString() : code,
                    timeout: settings.executionTimeout,
                })
                : await window.dockerAPI.execute({
                    blockId: id.toString(),
                    language,
                    version: getDefaultVersion(language),
                    code: ytext ? ytext.toString() : code,
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
        const currentCode = ytext ? ytext.toString() : code;
        if (isCodeEmpty(currentCode)) {
            // 코드가 비어있는 경우 즉시 변경
            applyLanguageChange(newLanguage);
            return;
        }

        // 코드가 있는 경우 모달 오픈
        setPendingLanguage(newLanguage);
        setIsConfirmModalOpen(true);
    };

    const applyLanguageChange = (newLanguage: Language) => {
        const template = getLanguageTemplate(newLanguage);
        // [New] Update Y.Text directly
        if (ytext) {
            ytext.delete(0, ytext.length);
            ytext.insert(0, template);
        } else {
            // Fallback for non-collaborative mode
            onChange(id, template);
        }
        // Language state is now managed by parent via Yjs, just notify parent
        if (noteId) setNoteLanguage(noteId, newLanguage);
        if (onLanguageChange) onLanguageChange(id, newLanguage);
    };

    const handleConfirmLanguageChange = () => {
        if (pendingLanguage) {
            applyLanguageChange(pendingLanguage);
        }
        setIsConfirmModalOpen(false);
        setPendingLanguage(null);
    };

    const handleCancelLanguageChange = () => {
        setIsConfirmModalOpen(false);
        setPendingLanguage(null);
    };

    const handleRestore = (code: string) => {
        // [New] Update Y.Text directly
        if (ytext) {
            ytext.delete(0, ytext.length);
            ytext.insert(0, code);
        } else {
            // Fallback for non-collaborative mode
            onChange(id, code);
        }
    };

    // [핵심 수정] AI 리뷰 핸들러: Yjs에만 저장, MongoDB에는 저장하지 않음
    const handleAiReview = async () => {
        if (!noteId) return;

        aiReviewAbortRef.current?.abort();
        aiReviewAbortRef.current = new AbortController();
        setAiReviewLoading(true);

        try {
            // AI 리뷰 API 호출 (현재 선택된 언어 전달)
            const response = await requestCodeReview(
                noteId,
                id.toString(),
                createReviewRequest(language, ytext ? ytext.toString() : code),
                aiReviewAbortRef.current.signal
            );

            // 리뷰 결과를 HTML로 변환하여 새 블록으로 추가 또는 기존 블록 업데이트
            // Yjs를 통해 실시간 동기화되지만 MongoDB에는 저장되지 않음
            if (onAiReviewResult) {
                const htmlContent = formatReviewAsHtml(response);
                onAiReviewResult(htmlContent);
            } else if (onAddBlockAfter) {
                const htmlContent = formatReviewAsHtml(response);
                onAddBlockAfter(htmlContent);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setAlertMessage(error.message || 'AI 리뷰 요청에 실패했습니다.');
                setIsAlertOpen(true);
            }
        } finally {
            setAiReviewLoading(false);
        }
    };

    // [REMOVED] Local editor focus tracking - not needed with Y.Text
    // [REMOVED] useEffect for syncing code prop to editedCode - Y.Text handles this

    const handleEditorFocus = () => {
        onFocus();
    };

    const handleEditorBlur = () => {
        onBlur?.(); // [New] Clear awareness state
    };

    return (
        <div
            id={id.toString()}
            className={`code-block-wrapper ${isFocused ? 'is-focused' : ''} ${bookmark ? 'is-bookmarked' : ''} ${showBookmark ? 'has-bookmark' : ''}`}
            onContextMenu={onContextMenu}
            onClick={(e) => e.stopPropagation()} // [Fix] Prevent clearing focus when clicking inside the block
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
                        disabled={loading || readOnly}
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

                        <BlockRunButton onClick={handleRun} disabled={loading || readOnly} />
                        <BlockCopyButton onCopy={handleCopy} />
                        <VersionButton
                            onClick={() => {
                                if (readOnly) return;
                                if (!noteId) {
                                    alert('노트가 저장되어야 버전 관리를 사용할 수 있습니다.');
                                    return;
                                }
                                setShowCheckpoints(true);
                            }}
                            disabled={readOnly}
                        />
                        <AiReviewButton
                            onClick={handleAiReview}
                            disabled={loading || readOnly}
                            loading={aiReviewLoading}
                            disabledReason={
                                readOnly
                                    ? '읽기 전용 모드에서는 사용할 수 없습니다'
                                    : (!noteId ? '노트를 저장해야 사용할 수 있습니다' : undefined)
                            }
                        />
                    </div>
                </div>

                <div className="code-content-container">
                    <CodeMirrorEditor
                        value={code}
                        ytext={ytext} // [New] Pass Y.Text for collaborative editing
                        language={language}
                        onChange={(value) => {
                            if (readOnly) return;
                            // [New] onChange is only used for fallback when ytext is null
                            // When ytext is provided, yCollab handles all updates
                            if (!ytext) {
                                onChange(id, value);
                            }
                        }}
                        onFocus={handleEditorFocus}
                        onBlur={handleEditorBlur}
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
                        currentCode={ytext ? ytext.toString() : code}
                        onClose={() => setShowCheckpoints(false)}
                        onRestore={handleRestore}
                    />
                )}
            </div>

            {/* Right Actions (Bookmark) */}
            <div className="block-actions-right">
                {showBookmark && (
                    <BlockBookmarkButton isBookmarked={bookmark} onClick={handleBookmark} />
                )}
            </div>

            {/* [New] Show editor avatar if someone else is editing */}
            {editors.length > 0 && (
                <BlockEditorAvatar editors={editors.slice(0, 1)} />
            )}

            {/* Language Change Confirmation Modal */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                message="언어를 변경하면 작성된 코드가 초기화되고 기본 템플릿이 적용됩니다. 계속하시겠습니까?"
                onConfirm={handleConfirmLanguageChange}
                onCancel={handleCancelLanguageChange}
            />

            {/* AI Review Failure Alert Modal */}
            <AlertModal
                isOpen={isAlertOpen}
                message={alertMessage}
                onClose={() => setIsAlertOpen(false)}
            />

        </div>
    );
};

export default CodeBlock;