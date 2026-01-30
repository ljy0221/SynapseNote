import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideMenuButton.css';

interface SideMenuButtonProps {
    to: string;
    icon: React.ReactNode;
    label: string; // 툴팁용으로만 유지
}

export const SideMenuButton: React.FC<SideMenuButtonProps> = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `side-menu-button ${isActive ? 'active' : ''}`}
            title={label}
        >
            <div className="icon-container">
                {icon}
            </div>
        </NavLink>
    );
};