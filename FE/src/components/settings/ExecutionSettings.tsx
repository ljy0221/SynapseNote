import React from 'react';
import { useCodeEditorStore } from '../../store/useCodeEditorStore';
import './ExecutionSettings.css';

/**
 * 코드 실행 타임아웃 설정 컴포넌트
 */
export const ExecutionSettings: React.FC = () => {
    const { settings, updateSettings } = useCodeEditorStore();

    return (
        <div className="execution-settings">
            <h3>실행 설정</h3>

            <div className="setting-item">
                <label htmlFor="execution-timeout">코드 실행 타임아웃</label>
                <select
                    id="execution-timeout"
                    value={settings.executionTimeout / 1000}
                    onChange={(e) => updateSettings({ executionTimeout: Number(e.target.value) * 1000 })}
                >
                    <option value={5}>5초</option>
                    <option value={10}>10초 (기본값)</option>
                    <option value={30}>30초</option>
                    <option value={60}>1분</option>
                </select>
                <p className="setting-description">
                    코드 실행 시 최대 대기 시간입니다. 세션 유휴 타임아웃은 30분으로 고정됩니다.
                </p>
            </div>

            <div className="setting-item">
                <label htmlFor="default-language">기본 언어</label>
                <select
                    id="default-language"
                    value={settings.defaultLanguage}
                    onChange={(e) => updateSettings({ defaultLanguage: e.target.value as any })}
                >
                    <option value="python">Python 3.11</option>
                    <option value="javascript">JavaScript (Node 20)</option>
                    <option value="java">Java 17</option>
                </select>
                <p className="setting-description">
                    새 코드 블럭의 기본 언어입니다.
                </p>
            </div>
        </div>
    );
};
