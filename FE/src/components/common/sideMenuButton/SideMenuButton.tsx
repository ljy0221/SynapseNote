import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideMenuButton.css';

interface SideMenuButtonProps {
    to?: string;
    icon: React.ReactNode;
    label: string; // 툴팁용
    onClick?: () => void;
    style?: React.CSSProperties;
    disabled?: boolean;
}

export const SideMenuButton: React.FC<SideMenuButtonProps> = ({ to, icon, label, onClick, style, disabled }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        onClick?.();
    };

    const combinedStyle = {
        ...style,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
    };

    if (!to) {
        return (
            <button
                className="side-menu-button"
                onClick={handleClick}
                title={label}
                type="button"
                style={combinedStyle}
                disabled={disabled}
            >
                <div className="icon-container">
                    {icon}
                </div>
            </button>
        );
    }

    return (
        <NavLink
            to={to}
            className={({ isActive }) => `side-menu-button ${isActive ? 'active' : ''}`}
            title={label}
            onClick={handleClick}
            style={combinedStyle}
        >
            <div className="icon-container">
                {icon}
            </div>
        </NavLink>
    );
};