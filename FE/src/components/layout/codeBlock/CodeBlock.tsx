/* src/components/layout/codeBlock/CodeBlock.tsx */
import React, { useState, useEffect } from 'react';
import { FileCode, Server } from 'lucide-react';
import VersionButton from '../../common/versionButton/VersionButton';
import BlockRunButton from '../../common/blockRunButton/BlockRunButton';
import BlockCopyButton from '../../common/blockCopyButton/BlockCopyButton';
import BlockActionMenu from '../../common/blockActionMenu/BlockActionMenu';
import CodeMirrorEditor from '../../common/codeMirrorEditor/CodeMirrorEditor';
import type { Language, ExecutionResult, ExecutionMode, SessionInfo } from '../../../types/execution/ExecutionTypes';
import './CodeBlock.css';
import { saveExecutionToBackend } from "../../../utils/executionAPI.ts";
import { LanguageSelector } from "./LanguageSelector.tsx";
import CheckpointSidebar from '../checkpoint/CheckpointSidebar';
import AiReviewButton from '../../common/aiReviewButton/AiReviewButton';
import AiReviewSection from '../aiReview/AiReviewSection';
import type { CodeReviewResponse } from '../../../types/ai/CodeReview';
import { requestCodeReview, DEFAULT_REVIEW_REQUEST } from '../../../api/ai/AiCodeReview.api';
import { getLanguageTemplate, isCodeEmpty } from '../../../utils/languageTemplates';
import { useCodeEditorStore } from '../../../store/useCodeEditorStore';
import { useToastStore } from '../../../store/useToastStore';

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
    isFocused?: boolean;
    isDragging?: boolean; // [추가]
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
    isFocused, // [추가] Focus prop Destructuring
    isDragging,
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
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

    // AI 리뷰 섹션 상태 (부모에서 캐싱 관리)
    const [showAiReview, setShowAiReview] = useState(false);
    const [aiReviewResult, setAiReviewResult] = useState<CodeReviewResponse | null>(null);
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const [aiReviewError, setAiReviewError] = useState<string | null>(null);

    // AbortController ref (요청 취소용)
    const aiReviewAbortRef = useRef<AbortController | null>(null);

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

    // Toast 알림 (feat/#63 추가)
    const { showToast } = useToastStore();

    // 초기 로드 시 비어있으면 템플릿 적용
    useEffect(() => {
        if (isCodeEmpty(code) && isCodeEmpty(editedCode)) {
            const template = getLanguageTemplate(language);
            setEditedCode(template);
            onChange(id, template);
        }
    }, []); // 빈 배열로 마운트 시 한 번만 실행

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

    // 언어 사용 추적 및 다중 언어 감지
    useEffect(() => {
        if (noteId) {
            // 블럭 ID와 함께 언어 추적
            trackBlockLanguage(noteId, id.toString(), language);

            // 다중 언어 사용 시 세션 모드 자동 비활성화
            const hasMultipleLangs = hasMultipleLanguages(noteId);
            if (hasMultipleLangs && executionMode === 'session') {
                setExecutionMode('single');
                // Toast 사용으로 변경
                showToast('이 노트는 여러 언어를 사용하고 있어 세션 모드가 비활성화되었습니다.', 'info');
            }
        }
    }, [noteId, id, language, trackBlockLanguage, hasMultipleLanguages, executionMode]);

    // 컴포넌트 언마운트 시 AI 리뷰 요청 취소
    useEffect(() => {
        return () => {
            aiReviewAbortRef.current?.abort();
        };
    }, []);

    const handleCopy = () => {
        if (typeof editedCode === "string") {
            navigator.clipboard.writeText(editedCode);
        }
        showToast('코드가 클립보드에 복사되었습니다.', 'success');
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

    // 언어 변경 핸들러
    const handleLanguageChange = (newLanguage: Language) => {
        // 코드가 비어있으면 템플릿 자동 적용
        if (isCodeEmpty(editedCode)) {
            const template = getLanguageTemplate(newLanguage);
            setEditedCode(template);
            onChange(id, template);
            setLanguage(newLanguage);
            if (noteId) {
                setNoteLanguage(noteId, newLanguage);
            }
            return;
        }

        // 코드가 있으면 사용자에게 확인
        const shouldApplyTemplate = window.confirm(
            '언어를 변경하면 기본 템플릿이 적용됩니다. 계속하시겠습니까?\n\n취소를 누르면 현재 코드를 유지하고 언어만 변경됩니다.'
        );

        if (shouldApplyTemplate) {
            const template = getLanguageTemplate(newLanguage);
            setEditedCode(template);
            onChange(id, template);
        }

        setLanguage(newLanguage);
        if (noteId) {
            setNoteLanguage(noteId, newLanguage);
        }
    };

    // Tab 키는 CodeMirror 내장 기능으로 처리됨

    // 버전 복구 핸들러
    const handleRestore = (code: string) => {
        setEditedCode(code);
        onChange(id, code);
    };

    // AI 코드 리뷰 핸들러
    const handleAiReview = async () => {
        if (!noteId) return;

        // 이전 요청 취소
        aiReviewAbortRef.current?.abort();
        aiReviewAbortRef.current = new AbortController();

        setAiReviewLoading(true);
        setAiReviewError(null);

        try {
            const response = await requestCodeReview(
                noteId,
                id.toString(),
                DEFAULT_REVIEW_REQUEST,
                aiReviewAbortRef.current.signal
            );
            setAiReviewResult(response);
        } catch (error: any) {
            // AbortError는 무시 (정상적인 취소)
            if (error.name !== 'AbortError') {
                setAiReviewError(
                    error.response?.data?.message || error.message || 'AI 리뷰 요청에 실패했습니다.'
                );
            }
        } finally {
            setAiReviewLoading(false);
        }
    };

    return (
        <div
            id={`block-${id}`}
            className="code-block-wrapper"
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuPosition({ x: e.clientX, y: e.clientY });
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{
                opacity: isDragging ? 0.4 : 1,
                transform: isDragging ? 'scale(0.98)' : 'none',
                transition: 'opacity 0.2s, transform 0.2s'
            }}
        >
            <div className="code-block-header">

                {/* [좌측] 드래그 및 메뉴 버튼 */}
                <BlockActionMenu
                    position={menuPosition}
                    onClose={() => setMenuPosition(null)}
                    onDelete={() => onDelete(id)}
                    draggable={draggable}
                    onDragStart={onDragStart}
                />

                {/* [중앙] 언어 선택기 */}
                <LanguageSelector
                    value={language}
                    onChange={handleLanguageChange}
                    disabled={loading}
                />

                {/* [우측] 액션 버튼 그룹 (Version -> Copy -> Single -> Session -> Run -> Menu) */}
                <div className="code-actions">
                    {/* 세션 인디케이터 (맨 앞에 배치) */}
                    {sessionInfo && executionMode === 'session' && (
                        <button
                            className="session-indicator"
                            onClick={handleTerminateSession}
                            title="세션 종료"
                            style={{
                                padding: '0 8px',
                                height: '32px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                marginRight: '4px'
                            }}
                        >
                            🟢 {sessionInfo.sessionId.substring(0, 6)}
                        </button>
                    )}

                    <VersionButton
                        onClick={() => {
                            if (!noteId) {
                                alert('노트가 저장되어야 버전 관리를 사용할 수 있습니다.');
                                return;
                            }
                            setShowCheckpoints(true);
                        }}
                    />

                    <BlockCopyButton onCopy={handleCopy} />

                    {/* 모드 선택 버튼 (Single / Session) */}
                    {(() => {
                        const hasMultiple = hasMultipleLanguages(noteId || '');
                        const isJava = language === 'java';

                        // 공통 스타일 (VersionButton 스타일 조합)
                        const getButtonStyle = (isActive: boolean, isDisabled: boolean) => ({
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            fontSize: '12px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            // 활성 상태일 때 배경색 미세하게, 테두리와 아이콘은 포인트 컬러
                            backgroundColor: isActive ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            color: isActive ? 'var(--color-point)' : 'var(--font-color-sub)',
                            border: `1px solid ${isActive ? 'var(--color-point)' : 'var(--color-border, #ccc)'}`,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            opacity: isDisabled ? 0.5 : 1,
                        });

                        return (
                            <>
                                <button
                                    className={`mode-button ${executionMode === 'single' ? 'active' : ''}`}
                                    onClick={() => setExecutionMode('single')}
                                    disabled={loading}
                                    style={getButtonStyle(executionMode === 'single', loading)}
                                    title="단일 실행 (Single Mode)"
                                >
                                    <FileCode size={18} />
                                </button>
                                <button
                                    className={`mode-button ${executionMode === 'session' ? 'active' : ''}`}
                                    onClick={() => {
                                        if (noteId && !hasMultiple && !isJava) {
                                            setExecutionMode('session');
                                        }
                                    }}
                                    disabled={loading || !noteId || hasMultiple || isJava}
                                    style={getButtonStyle(executionMode === 'session', loading || !noteId || !!hasMultiple || isJava)}
                                    title={
                                        !noteId ? '노트를 저장해야 세션 모드를 사용할 수 있습니다' :
                                            isJava ? 'Java는 세션 모드를 지원하지 않습니다' :
                                                hasMultiple ? '다중 언어 포함 노트는 세션 모드를 사용할 수 없습니다' :
                                                    '세션 모드 (Session Mode)'
                                    }
                                >
                                    <Server size={18} />
                                </button>
                            </>
                        );
                    })()}

                    <BlockRunButton onClick={handleRun} disabled={loading} />


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
                    autoFocus={isFocused}
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

            {/* AI 리뷰 섹션 (코드 블록 하단) */}
            {showAiReview && noteId && (
                <AiReviewSection
                    result={aiReviewResult}
                    isLoading={aiReviewLoading}
                    error={aiReviewError}
                    onRefresh={handleAiReview}
                    onClose={() => {
                        setShowAiReview(false);
                        setAiReviewResult(null); // 닫을 때 결과 초기화
                    }}
                />
            )}
        </div>
    );
};

export default CodeBlock;
