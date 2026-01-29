// src/common/components/themeToggle/ThemeToggle.tsx
import React from 'react';
import './ThemeToggle.css';
import { Sun, Moon, Waves, Cookie } from 'lucide-react'; // Lucide 아이콘 사용 (Cookie, Waves 포함)
import { ThemeMode } from '../../features/theme/UseTheme';

interface ThemeToggleProps {
  themeMode: ThemeMode; // string type ('light' | 'cookie' | 'dark' | 'deepblue')
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
      case 'light':
        return <Sun size={20} />;
      case 'cookie':
        return <Cookie size={20} />; // 쿠키 모드
      case 'dark':
        return <Moon size={20} />;
      case 'deepblue':
        return <Waves size={20} />;
      default:
        return <Sun size={20} />;
    }
  };

  const getTitle = () => {
    switch (themeMode) {
      case 'light': return '쿠키 모드로 전환';
      case 'cookie': return '다크 모드로 전환';
      case 'dark': return '딥블루 모드로 전환';
      case 'deepblue': return '라이트 모드로 전환';
      default: return '테마 전환';
    }
  };

  return (
    <button
      onClick={onToggle}
      className={`theme-toggle-btn ${className}`}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;