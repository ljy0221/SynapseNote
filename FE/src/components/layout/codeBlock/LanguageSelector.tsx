import React from 'react';
import type { Language } from '../../../types/execution/ExecutionTypes';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  value: Language;
  onChange: (value: Language) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <select
      className="code-lang-badge"
      value={value}
      onChange={(e) => onChange(e.target.value as Language)}
      disabled={disabled}
    >
      <option value="python">Python 3.11</option>
      <option value="javascript">JavaScript (Node 20)</option>
      <option value="java">Java 17</option>
    </select>
  );
};
