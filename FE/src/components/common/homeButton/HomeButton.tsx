// src/components/common/homeButton/HomeButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import './HomeButton.css';

interface HomeButtonProps {
    className?: string;
}

const HomeButton: React.FC<HomeButtonProps> = ({ className = '' }) => {
    const navigate = useNavigate();

    return (
        <button
            className={`home-button ${className}`}
            onClick={() => navigate('/home')}
            title="홈으로 이동"
        >
            <Home />

        </button>
    );
};

export default HomeButton;
