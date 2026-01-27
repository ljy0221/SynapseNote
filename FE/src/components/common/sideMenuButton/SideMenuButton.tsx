import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideMenuButton.css';

interface SideMenuButtonProps {
    to?: string;
    icon: React.ReactNode;
    label: string; // 툴팁용
    onClick?: () => void;
}

export const SideMenuButton: React.FC<SideMenuButtonProps> = ({ to, icon, label, onClick }) => {
    if (!to) {
        return (
            <button
                className="side-menu-button"
                onClick={onClick}
                title={label}
                type="button"
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
            onClick={onClick}
        >
            <div className="icon-container">
                {icon}
            </div>
        </NavLink>
    );
};