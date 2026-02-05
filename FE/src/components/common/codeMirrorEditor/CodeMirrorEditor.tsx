import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, StateEffect } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { autocompletion } from '@codemirror/autocomplete';
import { useCodeEditorStore } from '../../../store/useCodeEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';
import type { ThemeMode } from '../../../store/useThemeStore';
import './CodeMirrorEditor.css';

interface CodeMirrorEditorProps {
    value: string;
    language: 'python' | 'javascript' | 'java';
    onChange: (value: string) => void;
    onFocus?: () => void;
    readOnly?: boolean;
    minHeight?: string;
    maxHeight?: string;
}

const getLanguageExtension = (language: string) => {
    switch (language) {
        case 'python':
            return python();
        case 'javascript':
            return javascript();
        case 'java':
            return java();
        default:
            return javascript();
    }
};

// 앱 테마별 CodeMirror 커스텀 테마
const createCustomTheme = (themeMode: ThemeMode) => {
    const themeConfigs = {
        light: {
            // 기본 색상
            background: '#fffcf5',
            foreground: '#45372e',
            caret: '#f59e0b',
            selection: '#fae8d0',
            activeLine: '#f7f2e8',
            gutterBackground: '#f7f2e8',
            gutterForeground: '#78716c',
            gutterBorder: '#e7e5e4',
            // 구문 강조 색상 (따뜻한 톤)
            keyword: '#d97706',      // 키워드: 진한 앰버
            string: '#059669',       // 문자열: 에메랄드 그린
            number: '#dc2626',       // 숫자: 레드
            comment: '#78716c',      // 주석: 그레이
            function: '#0284c7',     // 함수: 스카이 블루
            variable: '#7c2d12',     // 변수: 다크 브라운
            operator: '#b45309',     // 연산자: 오렌지
            className: '#9333ea',    // 클래스명: 퍼플
        },
        cookie: {
            // 기본 색상
            background: '#2b2623',
            foreground: '#f5f5f4',
            caret: '#fbbf24',
            selection: '#44403c',
            activeLine: '#423b36',
            gutterBackground: '#423b36',
            gutterForeground: '#d6d3d1',
            gutterBorder: '#57534e',
            // 구문 강조 색상 (카라멜 & 골드 톤)
            keyword: '#fbbf24',      // 키워드: 골든 옐로우
            string: '#86efac',       // 문자열: 라이트 그린
            number: '#fca5a5',       // 숫자: 라이트 레드
            comment: '#a8a29e',      // 주석: 스톤
            function: '#7dd3fc',     // 함수: 라이트 블루
            variable: '#fde047',     // 변수: 옐로우
            operator: '#fb923c',     // 연산자: 오렌지
            className: '#c084fc',    // 클래스명: 라이트 퍼플
        },
        dark: {
            // 기본 색상
            background: '#000000',
            foreground: '#ffffff',
            caret: '#ffffff',
            selection: '#262626',
            activeLine: '#171717',
            gutterBackground: '#171717',
            gutterForeground: '#a3a3a3',
            gutterBorder: '#262626',
            // 구문 강조 색상 (모노크롬 & 메탈릭)
            keyword: '#e5e5e5',      // 키워드: 밝은 그레이
            string: '#a3a3a3',       // 문자열: 중간 그레이
            number: '#d4d4d4',       // 숫자: 라이트 그레이
            comment: '#525252',      // 주석: 다크 그레이
            function: '#ffffff',     // 함수: 화이트
            variable: '#d4d4d4',     // 변수: 라이트 그레이
            operator: '#e5e5e5',     // 연산자: 밝은 그레이
            className: '#fafafa',    // 클래스명: 거의 화이트
        },
        deepblue: {
            // 기본 색상
            background: '#020617',
            foreground: '#f8fafc',
            caret: '#0ea5e9',
            selection: '#1e293b',
            activeLine: '#0f172a',
            gutterBackground: '#0f172a',
            gutterForeground: '#94a3b8',
            gutterBorder: '#1e293b',
            // 구문 강조 색상 (사이버펑크 & 네온)
            keyword: '#22d3ee',      // 키워드: 시안
            string: '#86efac',       // 문자열: 네온 그린
            number: '#f472b6',       // 숫자: 핑크
            comment: '#64748b',      // 주석: 슬레이트
            function: '#38bdf8',     // 함수: 스카이 블루
            variable: '#bae6fd',     // 변수: 라이트 블루
            operator: '#0ea5e9',     // 연산자: 블루
            className: '#a78bfa',    // 클래스명: 바이올렛
        },
    };

    const config = themeConfigs[themeMode];
    const isDark = themeMode !== 'light';

    return EditorView.theme({
        '&': {
            backgroundColor: config.background,
            color: config.foreground,
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
        },
        '.cm-content': {
            caretColor: config.caret,
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
            fontVariantLigatures: 'normal',
        },
        '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: config.caret,
        },
        // Explicitly transparent when not focused to override defaults
        '.cm-activeLine': {
            backgroundColor: 'transparent',
        },
        '.cm-gutters': {
            backgroundColor: config.gutterBackground,
            color: config.gutterForeground,
            border: 'none',
            borderRight: `1px solid ${config.gutterBorder}`,
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
        },
        '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
        },
        // Only show highlight when focused
        '&.cm-focused .cm-activeLine': {
            backgroundColor: config.activeLine,
        },
        '&.cm-focused .cm-activeLineGutter': {
            backgroundColor: config.activeLine,
        },
        // 구문 강조 스타일
        '.cm-keyword': { color: config.keyword, fontWeight: '600' },
        '.cm-string': { color: config.string },
        '.cm-number': { color: config.number },
        '.cm-comment': { color: config.comment, fontStyle: 'italic' },
        '.cm-variableName': { color: config.variable },
        '.cm-propertyName': { color: config.function },
        '.cm-operator': { color: config.operator },
        '.cm-punctuation': { color: config.foreground },
        '.cm-bracket': { color: config.operator },
        '.cm-typeName, .cm-className': { color: config.className, fontWeight: '600' },
        '.cm-definition': { color: config.function, fontWeight: '600' },
        '.cm-function': { color: config.function },
        '.cm-meta': { color: config.comment },
        '.cm-tag': { color: config.keyword },
        '.cm-attribute': { color: config.variable },
        // 자동 완성 패널 스타일
        '.cm-tooltip.cm-tooltip-autocomplete': {
            backgroundColor: config.background,
            border: `1px solid ${config.gutterBorder}`,
        },
        '.cm-tooltip.cm-tooltip-autocomplete > ul': {
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
        },
        '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
            color: config.foreground,
        },
        '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
            backgroundColor: config.selection,
            color: config.foreground,
        },
        '.cm-completionLabel': {
            color: config.function,
        },
        '.cm-completionDetail': {
            color: config.comment,
            fontStyle: 'italic',
        },
    }, { dark: isDark });
};

// 구문 강조 스타일 생성
const createHighlightStyle = (themeMode: ThemeMode) => {
    const themeConfigs = {
        light: {
            keyword: '#d97706',
            string: '#059669',
            number: '#dc2626',
            comment: '#78716c',
            function: '#0284c7',
            variable: '#7c2d12',
            operator: '#b45309',
            className: '#9333ea',
        },
        cookie: {
            keyword: '#fbbf24',
            string: '#86efac',
            number: '#fca5a5',
            comment: '#a8a29e',
            function: '#7dd3fc',
            variable: '#fde047',
            operator: '#fb923c',
            className: '#c084fc',
        },
        dark: {
            keyword: '#e5e5e5',
            string: '#a3a3a3',
            number: '#d4d4d4',
            comment: '#525252',
            function: '#ffffff',
            variable: '#d4d4d4',
            operator: '#e5e5e5',
            className: '#fafafa',
        },
        deepblue: {
            keyword: '#22d3ee',
            string: '#86efac',
            number: '#f472b6',
            comment: '#64748b',
            function: '#38bdf8',
            variable: '#bae6fd',
            operator: '#0ea5e9',
            className: '#a78bfa',
        },
    };

    const config = themeConfigs[themeMode];

    return HighlightStyle.define([
        { tag: t.keyword, color: config.keyword, fontWeight: '600' },
        { tag: [t.name, t.deleted, t.character, t.macroName], color: config.variable },
        { tag: [t.function(t.variableName), t.labelName], color: config.function, fontWeight: '600' },
        { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: config.variable },
        { tag: [t.definition(t.name), t.separator], color: config.variable },
        { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: config.className, fontWeight: '600' },
        { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: config.operator },
        { tag: [t.meta, t.comment], color: config.comment, fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.strikethrough, textDecoration: 'line-through' },
        { tag: t.link, color: config.function, textDecoration: 'underline' },
        { tag: t.heading, fontWeight: 'bold', color: config.keyword },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: config.number },
        { tag: [t.processingInstruction, t.string, t.inserted], color: config.string },
        { tag: t.invalid, color: '#dc2626' },
    ]);
};


const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
    value,
    language,
    onChange,
    onFocus,
    readOnly = false,
    minHeight = '150px',
    maxHeight = '800px',
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Zustand 스토어에서 설정만 가져오기 (인스턴스 관리 제거)
    const { settings } = useCodeEditorStore();

    // 앱 테마 가져오기
    const themeMode = useThemeStore((state) => state.themeMode);

    // 자동 높이 조절 테마
    const autoHeightTheme = EditorView.theme({
        '&': {
            height: 'auto',
        },
        '.cm-scroller': {
            overflow: 'auto',
            maxHeight: maxHeight,
            minHeight: minHeight,
        },
    });

    // 에디터 초기화
    useEffect(() => {
        if (!editorRef.current) return;

        const state = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
                getLanguageExtension(language),
                createCustomTheme(themeMode),
                syntaxHighlighting(createHighlightStyle(themeMode)),
                autocompletion({
                    activateOnTyping: true,
                    override: [],
                }),
                autoHeightTheme,
                EditorState.readOnly.of(readOnly),
                EditorState.tabSize.of(settings.tabSize),
                EditorView.lineWrapping,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                }),
                EditorView.domEventHandlers({
                    focus: () => onFocus?.(),
                }),
            ],
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, []); // 초기 마운트 시에만 실행

    // value prop 변경 시 에디터 업데이트 (커서 위치 보존)
    useEffect(() => {
        if (viewRef.current && value !== undefined) {
            const currentValue = viewRef.current.state.doc.toString();
            if (currentValue !== value) {
                // 현재 커서 위치 저장
                const cursorPos = viewRef.current.state.selection.main.head;

                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: currentValue.length,
                        insert: value,
                    },
                    // 커서 위치 보존 (새 텍스트 길이를 초과하지 않도록)
                    selection: { anchor: Math.min(cursorPos, value.length) },
                });
            }
        }
    }, [value]);

    // 언어, 테마, 설정 변경 시 재구성
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: StateEffect.reconfigure.of([
                    basicSetup,
                    getLanguageExtension(language),
                    createCustomTheme(themeMode),
                    syntaxHighlighting(createHighlightStyle(themeMode)),
                    autocompletion({
                        activateOnTyping: true,
                        override: [],
                    }),
                    autoHeightTheme,
                    EditorState.readOnly.of(readOnly),
                    EditorState.tabSize.of(settings.tabSize),
                    EditorView.lineWrapping,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            onChange(update.state.doc.toString());
                        }
                    }),
                    EditorView.domEventHandlers({
                        focus: () => onFocus?.(),
                    }),
                ]),
            });
        }
    }, [language, themeMode, settings.tabSize, readOnly]);

    return <div ref={editorRef} className="codemirror-container" />;
};

export default CodeMirrorEditor;
