import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideMenuItem.css';

interface SideMenuItemProps {
    to: string;
    icon: string;
    label: string;
}

export const SideMenuItem: React.FC<SideMenuItemProps> = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `side-menu-item ${isActive ? 'active' : ''}`}
        >
            <span className="menu-icon">{icon}</span>
            <span className="menu-text">{label}</span>
        </NavLink>
    );
};