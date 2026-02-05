import React, { useEffect, useState, useCallback } from 'react';
import { useWebRTC } from '../../../hooks/useWebRTC';
import './VoiceChannelSidebar.css';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';

interface VoiceChannelSidebarProps {
    noteId: string;
    accessToken: string;
    user: { memberId: string; name: string };
    getMemberName: (id: string) => string;
    onConnect?: () => void;
}

export const VoiceChannelSidebar: React.FC<VoiceChannelSidebarProps> = ({
    noteId,
    accessToken,
    user,
    getMemberName,
    onConnect
}) => {
    const {
        status,
        joinVoice,
        leaveVoice,
        toggleMute,
        isMuted,
        participants,
        volume,
        setVolume,
        inputVolume,
        setInputVolume,
        socketConnected
    } = useWebRTC({
        noteId,
        memberId: user.memberId,
        token: accessToken,
        onConnect
    });

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    const handleInputVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setInputVolume(val);
    };

    // Auto-disconnect on unmount is handled by hook

    // Handler for join button
    const handleJoin = async () => {
        await joinVoice();
    };

    return (
        <div className="voice-channel-sidebar">
            {/* 1. Header Area */}
            <div className="voice-channel-header">
                <div className="header-title">
                    <Volume2 size={16} />
                    <span>음성 채널</span>
                </div>
                <div className={`status-badge ${status}`}>
                    {status === 'connected' ? 'LIVE' : status === 'connecting' ? '...' : ''}
                </div>
            </div>

            {/* 2. Participant List (Scrollable) */}
            <div className="participant-list">
                {/* Me (Only show if joined) */}
                {status === 'connected' && (
                    <div className="participant-item me">
                        <div className="participant-avatar me">
                            {user.name.slice(0, 1)}
                            {isMuted && <div className="mute-badge"><MicOff size={8} /></div>}
                        </div>
                        <div className="participant-info">
                            <span className="participant-name">{user.name}</span>
                            <span className="participant-status">나</span>
                        </div>
                    </div>
                )}

                {/* Others */}
                {participants.map(p => (
                    <div key={p.memberId} className="participant-item">
                        <div className="participant-avatar">
                            {getMemberName(p.memberId)?.slice(0, 1) || '?'}
                            {p.isMuted && <div className="mute-badge"><MicOff size={8} /></div>}
                        </div>
                        <span className="participant-name">
                            {getMemberName(p.memberId) || 'Unknown'}
                        </span>
                    </div>
                ))}

                {participants.length === 0 && status !== 'connected' && (
                    <div className="empty-state">
                        {status === 'connecting' ? '연결 중...' : '대기 중'}
                    </div>
                )}
            </div>

            {/* 3. Bottom Controls (Fixed) */}
            <div className="voice-bottom-controls">
                {status === 'connected' ? (
                    <>
                        <div className="control-row">
                            <button
                                className={`control-btn ${isMuted ? 'muted' : ''}`}
                                onClick={toggleMute}
                                title={isMuted ? "마이크 켜기" : "음소거"}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button
                                className="control-btn disconnect"
                                onClick={leaveVoice}
                                title="연결 끊기"
                            >
                                <PhoneOff size={18} />
                            </button>
                        </div>

                        {/* Mini Volume Sliders (Optional/Compact) */}
                        <div className="volume-sliders">
                            <div className="slider-group" title="수신 음량">
                                <Volume2 size={12} />
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={volume} onChange={handleVolumeChange}
                                />
                            </div>
                            <div className="slider-group" title="마이크 감도">
                                <Mic size={12} />
                                <input
                                    type="range" min="0" max="2" step="0.1"
                                    value={inputVolume} onChange={handleInputVolumeChange}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <button
                        className={`join-btn-full ${!socketConnected ? 'disabled' : ''}`}
                        onClick={handleJoin}
                        disabled={status === 'connecting' || !socketConnected}
                    >
                        {status === 'connecting' ? '연결 중...' : '음성 참여하기'}
                    </button>
                )}
            </div>
        </div>
    );
};
