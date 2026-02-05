import { useRef, useState, useEffect, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import { SignalingMessage, AnswerMessage, IceCandidateMessage, Participant } from '../types/webrtc/WebRTC';

const SIGNALING_SERVER_URL = 'wss://i14b102.p.ssafy.io/webrtc';

interface UseWebRTCOptions {
    noteId: string | null;
    memberId: string;
    token: string | null;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export const useWebRTC = ({ noteId, memberId, token, onConnect, onDisconnect }: UseWebRTCOptions) => {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isMuted, setIsMuted] = useState(false);

    // Refs
    const stompClientRef = useRef<Client | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callIdRef = useRef<string>('');
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // 로그 유틸
    const log = (msg: string) => console.log(`[WebRTC] ${msg}`);
    const errorLog = (msg: string, err?: any) => console.error(`[WebRTC] ${msg}`, err);

    // Audio Element initialization
    useEffect(() => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        // audio.controls = true; // Debugging
        audio.style.display = 'none';
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;

        return () => {
            if (audio.parentNode) {
                audio.parentNode.removeChild(audio);
            }
        };
    }, []);

    const connect = useCallback(() => {
        if (status === 'connected' || status === 'connecting') return;
        if (!noteId || !token) {
            errorLog('Cannot connect: Missing noteId or token');
            return;
        }

        setStatus('connecting');

        const client = new Client({
            brokerURL: SIGNALING_SERVER_URL,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                log('STOMP Connected');
                subscribeToSignaling(client);
                joinRoom(client);
                setStatus('connected');
                onConnect?.();
            },
            onStompError: (frame) => {
                errorLog('STOMP Error', frame);
                setStatus('error');
            },
            onWebSocketClose: () => {
                log('WebSocket Closed');
                setStatus('disconnected');
            }
        });

        client.activate();
        stompClientRef.current = client;
    }, [noteId, token, status, onConnect]);

    const disconnect = useCallback(() => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            if (noteId) {
                stompClientRef.current.publish({
                    destination: '/app/webrtc/leave',
                    body: JSON.stringify({ noteId })
                });
            }
            stompClientRef.current.deactivate();
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }

        setStatus('disconnected');
        setParticipants([]);
        onDisconnect?.();
        log('Disconnected');
    }, [noteId, onDisconnect]);

    const subscribeToSignaling = (client: Client) => {
        client.subscribe('/user/queue/webrtc', (message: IMessage) => {
            const data: SignalingMessage = JSON.parse(message.body);
            handleSignalingMessage(data);
        });

        client.subscribe('/user/queue/webrtc/answer', (message: IMessage) => {
            const data: AnswerMessage = JSON.parse(message.body);
            handleAnswerMessage(data);
        });

        client.subscribe('/user/queue/webrtc/ice', (message: IMessage) => {
            const data: IceCandidateMessage = JSON.parse(message.body);
            handleIceCandidateMessage(data);
        });
    };

    const joinRoom = async (client: Client) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });

            createPeerConnection(stream);

            client.publish({
                destination: '/app/webrtc/join',
                body: JSON.stringify({ noteId })
            });
            log(`Joined room: ${noteId}`);
        } catch (err) {
            errorLog('Failed to join room (Media/PC error)', err);
            disconnect();
        }
    };

    const createPeerConnection = (stream: MediaStream) => {
        if (peerConnectionRef.current) return;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && stompClientRef.current) {
                stompClientRef.current.publish({
                    destination: '/app/webrtc/ice',
                    body: JSON.stringify({
                        noteId,
                        callId: callIdRef.current,
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    })
                });
            }
        };

        pc.ontrack = (event) => {
            log('Received remote track');
            if (event.streams && event.streams[0]) {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                    remoteAudioRef.current.play().catch(e => errorLog('Audio Play Error', e));
                }
            }
        };

        peerConnectionRef.current = pc;
    };

    const handleSignalingMessage = async (data: SignalingMessage) => {
        if (data.type === 'JOINED') {
            log('Room join confirmed by server. Ready to offer.');
            if (data.status === 'READY') {
                createAndSendOffer();
            }
        } else if (data.type === 'ERROR') {
            errorLog('Signaling Error:', data.payload);
        }
    };

    const createAndSendOffer = async () => {
        const pc = peerConnectionRef.current;
        const client = stompClientRef.current;
        if (!pc || !client) return;

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            callIdRef.current = `call-${Date.now()}`;

            client.publish({
                destination: '/app/webrtc/offer',
                body: JSON.stringify({
                    noteId,
                    callId: callIdRef.current,
                    sdp: offer.sdp
                })
            });
            log('Sent SDP Offer');
        } catch (e) {
            errorLog('Error creating offer', e);
        }
    };

    const handleAnswerMessage = async (data: AnswerMessage) => {
        const pc = peerConnectionRef.current;
        if (pc && data.sdp) {
            try {
                await pc.setRemoteDescription({
                    type: 'answer',
                    sdp: data.sdp
                });
                log('Applied SDP Answer');
            } catch (e) {
                errorLog('Error setting remote description', e);
            }
        }
    };

    const handleIceCandidateMessage = async (data: IceCandidateMessage) => {
        const pc = peerConnectionRef.current;
        if (pc) {
            try {
                await pc.addIceCandidate({
                    candidate: data.candidate,
                    sdpMid: data.sdpMid,
                    sdpMLineIndex: data.sdpMLineIndex
                });
            } catch (e) {
                errorLog('Error adding ICE candidate', e);
            }
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    };

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return {
        status,
        connect,
        disconnect,
        toggleMute,
        isMuted,
        participants
    };
};
