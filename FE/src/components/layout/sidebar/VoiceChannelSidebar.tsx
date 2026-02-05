import React from 'react';
import { useWebRTC } from '../../../hooks/useWebRTC';
import './VoiceChannelSidebar.css';
import { Mic, MicOff, PhoneOff, Volume2, Radio } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

interface VoiceChannelSidebarProps {
    noteId: string | null;
}

export const VoiceChannelSidebar: React.FC<VoiceChannelSidebarProps> = ({ noteId }) => {
    const { userInfo, accessToken } = useAuthStore();
    const user = {
        memberId: userInfo?.memberId || 'unknown',
        name: userInfo?.name || 'Guest'
    };

    const {
        status,
        connect,
        disconnect,
        toggleMute,
        isMuted,
        participants
    } = useWebRTC({
        noteId,
        memberId: user.memberId,
        token: accessToken
    });

    if (!noteId) return null;

    const handleJoin = () => {
        if (accessToken) {
            connect();
        } else {
            alert('로그인이 필요합니다.');
        }
    };

    if (status === 'disconnected') {
        return (
            <div className="voice-channel-sidebar">
                <button className="join-voice-btn" onClick={handleJoin}>
                    <Radio size={16} />
                    음성 채널 참여하기
                </button>
            </div>
        );
    }

    return (
        <div className="voice-channel-sidebar">
            <div className="voice-connection-status">
                <div className="connection-info">
                    <span className="channel-name">
                        <Volume2 size={14} />
                        음성 채널
                    </span>
                    <span className={`status-text ${status}`}>
                        {status === 'connected' ? '연결됨' : '연결 중...'}
                    </span>
                </div>
                <div className="voice-actions">
                    <button
                        className={`voice-action-btn ${isMuted ? 'active' : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? "음소거 해제" : "음소거"}
                    >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <button
                        className="voice-action-btn"
                        onClick={disconnect}
                        title="연결 끊기"
                    >
                        <PhoneOff size={16} />
                    </button>
                </div>
            </div>

            {(status === 'connected' || status === 'connecting') && (
                <div className="participant-list">
                    {/* 내 자신 */}
                    <div className="participant-item">
                        <div className="participant-avatar">
                            {user.name.slice(0, 1)}
                        </div>
                        <span className="participant-name">{user.name} (나)</span>
                        {isMuted && <MicOff size={12} className="status-icon" />}
                    </div>
                    {/* 다른 참가자들 (현재는 목록이 비어있음) */}
                    {participants.map(p => (
                        <div key={p.memberId} className="participant-item">
                            <div className="participant-avatar">?</div>
                            <span className="participant-name">{p.memberId}</span>
                        </div>
                    ))}
                    {participants.length === 0 && status === 'connected' && (
                        <div style={{ padding: '8px', fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
                            대기 중...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
