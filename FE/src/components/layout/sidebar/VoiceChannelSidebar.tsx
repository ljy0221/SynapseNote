import React, {useEffect, useState, useCallback} from 'react';
import {useWebRTC} from '../../../hooks/useWebRTC';
import './VoiceChannelSidebar.css';
import {Mic, MicOff, PhoneOff, Volume2, Volume1, VolumeX, Radio} from 'lucide-react';
// ...
const {
    status,
    connect,
    disconnect,
    toggleMute,
    isMuted,
    participants,
    volume,
    setVolume,
    inputVolume,
    setInputVolume
} = useWebRTC({
    noteId,
    memberId: user.memberId,
    token: accessToken,
    onConnect
});

// ...

const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
};

const handleInputVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVolume(parseFloat(e.target.value));
};

return (
    <div className="voice-channel-sidebar">
        <div className="voice-connection-status">
            <div className="connection-info">
                <span className="channel-name">
                    <Volume2 size={14}/>
                    음성 채널
                </span>
                <span className={`status-text ${status}`}>
                    {status === 'connected' ? '연결됨' : '연결 중...'}
                </span>
            </div>
            <div className="voice-actions">
                <div className="volume-control-group">
                    {/* Output Volume */}
                    <div className="volume-control" title="수신 음량">
                        {volume === 0 ? <VolumeX size={14}/> : volume < 0.5 ? <Volume1 size={14}/> :
                            <Volume2 size={14}/>}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                            style={{width: '50px'}}
                        />
                    </div>
                    {/* Input Volume */}
                    <div className="volume-control" title="마이크 음량">
                        <Mic size={14}/>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={inputVolume}
                            onChange={handleInputVolumeChange}
                            className="volume-slider"
                            style={{width: '50px'}}
                        />
                    </div>
                </div>
                <div className="action-buttons">
                    <button
                        className={`voice-action-btn ${isMuted ? 'active' : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? "음소거 해제" : "음소거"}
                    >
                        {isMuted ? <MicOff size={16}/> : <Mic size={16}/>}
                    </button>
                    <button
                        className="voice-action-btn"
                        onClick={disconnect}
                        title="연결 끊기"
                    >
                        <PhoneOff size={16}/>
                    </button>
                </div>
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
                    {isMuted && <MicOff size={12} className="status-icon"/>}
                </div>
                {/* 다른 참가자들 */}
                {participants.map(p => (
                    <div key={p.memberId} className="participant-item">
                        <div className="participant-avatar">
                            {getMemberName(p.memberId).slice(0, 1)}
                        </div>
                        <span className="participant-name">
                            {getMemberName(p.memberId)}
                        </span>
                        {p.isMuted && <MicOff size={12} className="status-icon"/>}
                    </div>
                ))}
                {participants.length === 0 && status === 'connected' && (
                    <div style={{padding: '8px', fontSize: '0.8rem', color: '#999', textAlign: 'center'}}>
                        대기 중...
                    </div>
                )}
            </div>
        )}
    </div>
);
}
;
