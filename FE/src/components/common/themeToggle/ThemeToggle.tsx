// src/common/components/themeToggle/ThemeToggle.tsx
import React from 'react';
import './ThemeToggle.css';
import { Sun, Moon, Waves, Cookie } from 'lucide-react';
import { ThemeMode } from '../../features/theme/UseTheme';
import { Tooltip } from '../tooltip/Tooltip';

interface ThemeToggleProps {
  themeMode: ThemeMode; // 'light' | 'cookie' | 'dark' | 'deepblue'
  onToggle: () => void;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  themeMode,
  onToggle,
  className = ''
}) => {
  const getIcon = () => {
    switch (themeMode) {
      case 'light': return <Sun size={20} />;
      case 'cookie': return <Cookie size={20} />;
      case 'dark': return <Moon size={20} />;
      case 'deepblue': return <Waves size={20} />;
      default: return <Sun size={20} />;
    }
  };

  // 다음 테마에 대한 감성적인 안내 메시지
  const getTooltipContent = () => {
    switch (themeMode) {
      case 'light': return "달콤한 휴식이 필요하신가요?";
      case 'cookie': return "집중을 위해 밤으로 떠나볼까요?";
      case 'dark': return "더 깊은 지혜의 바다로.";
      case 'deepblue': return "다시 밝은 아침을 맞이하세요.";
      default: return "테마 변경";
    }
  };

  return (
    <Tooltip content={getTooltipContent()} placement="bottom">
      <button
        onClick={onToggle}
        className={`theme-toggle-btn ${className}`}
        aria-label="테마 변경"
      >
        {getIcon()}
      </button>
    </Tooltip>
  );
};

export default ThemeToggle;