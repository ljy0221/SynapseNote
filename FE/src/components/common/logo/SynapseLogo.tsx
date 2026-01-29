import React from 'react';

/**
 * Synapse Logo Component
 * 
 * Concept: "The Thinking Mind"
 * A stylized human profile (side view) containing a constellation-like neural network.
 * Represents the connection between human thought and the Synapse application.
 */
export const SynapseLogo: React.FC<React.SVGProps<SVGSVGElement>> = ({ ...props }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            {/* Concept: "Structural L-Workflow" 
                Hexagonal frame containing an orthogonal (L-shaped) workflow structure.
                Represents logical flow and solid architecture.
            */}

            {/* 1. Hexagon Frame */}
            <path
                d="M50 10L86 30V70L50 90L14 70V30L50 10Z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 2. Workflow Nodes */}

            {/* Root Node (Top Center) */}
            <circle cx="50" cy="35" r="5" fill="currentColor" />

            {/* Child Node 1 (Bottom Left) */}
            <rect x="28" y="60" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="5" fill="none" />

            {/* Child Node 2 (Bottom Right) */}
            <rect x="62" y="60" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="5" fill="none" />

            {/* 3. Orthogonal Connections (The "L-Shape") 
                Using polyline for crisp 90-degree turns.
            */}

            {/* Root to Left Child (The 'Left L') */}
            <polyline
                points="50 40 50 48 33 48 33 60"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Root to Right Child (The 'Right L') */}
            <polyline
                points="50 40 50 48 67 48 67 60"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

        </svg>
    );
};

export default SynapseLogo;
