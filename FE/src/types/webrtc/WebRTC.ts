export interface SignalingMessage {
    type: string;
    noteId?: string;
    memberId?: string;
    status?: string;
    payload?: string;
}

export interface AnswerMessage {
    noteId: string;
    callId: string;
    sdp: string;
}

export interface IceCandidateMessage {
    noteId: string;
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
}

export interface Participant {
    memberId: string;
    status: 'connected' | 'connecting' | 'disconnected';
    isMuted: boolean;
    isSpeaking: boolean;
    connectionState: RTCPeerConnectionState;
}
