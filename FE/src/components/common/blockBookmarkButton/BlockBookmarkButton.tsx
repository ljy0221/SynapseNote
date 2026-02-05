import React from 'react';
import { Star } from 'lucide-react';
import { Tooltip } from '../tooltip/Tooltip';
import './BlockBookmarkButton.css';

interface BlockBookmarkButtonProps {
    onClick?: () => void;
    isBookmarked?: boolean;
}

export const BlockBookmarkButton: React.FC<BlockBookmarkButtonProps> = ({
    onClick,
    isBookmarked = false,
}) => {
    return (
        <Tooltip title="북마크" placement="left">
            <button
                className={`bookmark-btn ${isBookmarked ? 'is-active' : ''}`}
                onClick={onClick}
                aria-label="북마크"
            >
                <Star size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
        </Tooltip>
    );
};
