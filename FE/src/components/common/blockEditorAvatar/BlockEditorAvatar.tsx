import React from 'react';
import './BlockEditorAvatar.css';
import './BlockEditorAvatarTooltip.css'; // [New] Smaller tooltip styling
import { AwarenessUser } from '../../../hooks/useYjsStore';
import { Tooltip } from '../tooltip/Tooltip'; // [New] Import Tooltip

interface BlockEditorAvatarProps {
    editors: AwarenessUser[];
    size?: number;
}

export const BlockEditorAvatar: React.FC<BlockEditorAvatarProps> = ({
    editors,
    size = 24
}) => {
    const [imageError, setImageError] = React.useState(false);

    if (editors.length === 0) return null;

    // Helper to get initials from name
    const getInitials = (name?: string) => {
        if (!name) return '?';
        const cleanName = name.trim();
        if (cleanName.length === 0) return '?';
        return cleanName.charAt(0).toUpperCase();
    };

    // Helper to generate color from name
    const getColor = (name: string) => {
        const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Show only the first editor (or we could show multiple with overlap)
    const editor = editors[0];
    const displayName = editor.memberName;
    const initials = getInitials(displayName);
    const bgColor = getColor(displayName);

    return (
        <div className="block-editor-avatar-container" style={{ right: '1px' }}>
            <Tooltip
                title={displayName}
                placement="bottom"
            >
                <div
                    className="block-editor-avatar"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: bgColor,
                        color: '#fff'
                    }}
                >
                    {editor.profileImageUrl && !imageError ? (
                        <img
                            src={editor.profileImageUrl}
                            alt={displayName}
                            className="block-editor-avatar-img"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="block-editor-avatar-initials">
                            {initials}
                        </div>
                    )}
                </div>
            </Tooltip>
        </div>
    );
};
