import React from 'react';
import { Github, Chrome } from 'lucide-react'; // Google은 보통 Chrome 아이콘이나 G 로고 SVG 사용
import './SocialLoginButton.css';

interface SocialLoginButtonProps {
    provider: 'github' | 'google';
    onClick: () => void;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick }) => {
    const isGithub = provider === 'github';

    return (
        <button
            className={`social-login-button ${provider}`}
            onClick={onClick}
            type="button"
        >
            <span className="social-icon">
                {isGithub ? <Github size={20} /> : <Chrome size={20} />}
            </span>
            <span className="social-text">
                {isGithub ? 'Sign in with GitHub' : 'Sign in with Google'}
            </span>
        </button>
    );
};