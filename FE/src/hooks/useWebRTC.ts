import { useRef, useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { SignalingMessage, AnswerMessage, IceCandidateMessage, Participant } from '../types/webrtc/WebRTC';

// Derive WebRTC URL from YJS URL (shared base)
const BASE_WS_URL = import.meta.env.VITE_WS_URL || 'wss://i14b102.p.ssafy.io/yjs';
const SIGNALING_SERVER_URL = BASE_WS_URL.replace(/\/yjs$/, '/webrtc');

interface UseWebRTCOptions {
    noteId: string | null;
    memberId: string;
    token: string | null;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export const useWebRTC = ({ noteId, memberId, token, onConnect }: UseWebRTCOptions) => {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    // Refs
    const stompClientRef = useRef<Client | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callIdRef = useRef<string>('');
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // Audio Context for Input Volume Processing
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    const [volume, setVolumeState] = useState(1.0); // Output Volume
    const [inputVolume, setInputVolumeState] = useState(1.0); // Input Volume (Mic)

    // 로그 유틸
    const log = (msg: string) => console.log(`[WebRTC] ${msg}`);
    const errorLog = (msg: string, err?: any) => console.error(`[WebRTC] ${msg}`, err);

    // Audio Element initialization
    useEffect(() => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;

        return () => {
            if (audio.parentNode) {
                audio.parentNode.removeChild(audio);
            }
        };
    }, []);

    const createPeerConnection = (stream: MediaStream) => {
        if (peerConnectionRef.current) return;

        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: import.meta.env.VITE_TURN_URL,
                    username: import.meta.env.VITE_TURN_USERNAME,
                    credential: import.meta.env.VITE_TURN_CREDENTIAL
                }
            ]
        });

        // Add Local Tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // On ICE Candidate
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

        // On Track (Remote Stream)
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

    // 2. Join Voice (Active participation)
    const joinVoice = async () => {
        if (!stompClientRef.current || !stompClientRef.current.connected) {
            errorLog('Socket not connected yet');
            return;
        }
        if (status === 'connected' || status === 'connecting') return;

        setStatus('connecting');

        try {
            // 1. Get Media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            // 2. Setup Web Audio API
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const gainNode = audioCtx.createGain();
            const destination = audioCtx.createMediaStreamDestination();

            gainNode.gain.value = inputVolume;

            source.connect(gainNode);
            gainNode.connect(destination);

            sourceNodeRef.current = source;
            gainNodeRef.current = gainNode;
            destinationNodeRef.current = destination;

            // 3. Create PeerConnection
            createPeerConnection(destination.stream);

            // 4. Send Join Request
            log('Sending JOIN request...');
            stompClientRef.current.publish({
                destination: '/app/webrtc/join',
                body: JSON.stringify({ noteId, memberId })
            });

        } catch (e) {
            errorLog('Failed to join voice', e);
            setStatus('disconnected');
            leaveVoice();
        }
    };

    // 3. Leave Voice
    const leaveVoice = useCallback(() => {
        if (status === 'disconnected') return;

        log('Leaving voice channel...');

        if (stompClientRef.current && stompClientRef.current.connected) {
            if (noteId && memberId && status === 'connected') {
                stompClientRef.current.publish({
                    destination: '/app/webrtc/leave',
                    body: JSON.stringify({ noteId, memberId })
                });
            }
        }

        // Cleanup Media
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
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setStatus('disconnected');
        setIsMuted(false);
    }, [noteId, memberId, status, log]);

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

    const handleSignalingMessage = async (data: SignalingMessage) => {
        if (data.type === 'PARTICIPANT_LIST') {
            if (data.payload) {
                try {
                    const initialMembers: { memberId: string, name: string, isMuted: boolean }[] = JSON.parse(data.payload);
                    const mapped: Participant[] = initialMembers.map(m => ({
                        memberId: m.memberId,
                        name: m.name,
                        isMuted: m.isMuted,
                        status: 'connected',
                        isSpeaking: false,
                        connectionState: 'connected'
                    }));
                    setParticipants(mapped);
                    log(`Loaded ${mapped.length} participants (Observer Mode)`);
                } catch (e) {
                    errorLog('Failed to parse participant list', e);
                }
            }
        }
        else if (data.type === 'JOINED') {
            log('Room join confirmed by server. Ready to offer.');
            setStatus('connected');
            if (data.payload) {
                try {
                    const initialMembers: { memberId: string, name: string, isMuted: boolean }[] = JSON.parse(data.payload);
                    setParticipants(() => {
                        const newParticipants = initialMembers
                            .filter(m => m.memberId !== memberId)
                            .map(m => ({
                                memberId: m.memberId,
                                name: m.name,
                                status: 'connected',
                                isMuted: m.isMuted,
                                isSpeaking: false,
                                connectionState: 'connected'
                            } as Participant));
                        return [...newParticipants];
                    });
                } catch (e) {
                    errorLog('Failed to parse participant list from JOINED payload', e);
                }
            }
            if (data.status === 'READY') {
                createAndSendOffer();
            }
        } else if (data.type === 'ERROR') {
            errorLog('Signaling Error:', data.payload);
            if (status === 'connecting') {
                setStatus('error');
                leaveVoice();
            }
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

    const handleRoomMessage = (data: SignalingMessage) => {
        if (data.type === 'USER_JOINED') {
            log(`User joined: ${data.memberId}`);
            if (data.memberId && data.memberId !== memberId) {
                let pName = 'Unknown User';
                let pMuted = false;

                // Parse Payload if available (New format)
                if (data.payload) {
                    try {
                        const pInfo = JSON.parse(data.payload);
                        if (pInfo.name) pName = pInfo.name;
                        if (pInfo.isMuted !== undefined) pMuted = pInfo.isMuted;
                    } catch (e) { /* ignore parse error */ }
                }

                setParticipants(prev => {
                    // 중복 방지
                    if (prev.some(p => p.memberId === data.memberId)) return prev;
                    return [...prev, {
                        memberId: data.memberId!,
                        name: pName,
                        status: 'connected',
                        isMuted: pMuted,
                        isSpeaking: false,
                        connectionState: 'new'
                    }];
                });
            }
        } else if (data.type === 'USER_LEFT') {
            log(`User left: ${data.memberId}`);
            if (data.memberId) {
                setParticipants(prev => prev.filter(p => p.memberId !== data.memberId));
            }
        } else if (data.type === 'USER_MUTE_CHANGED') {
            log(`User mute changed: ${data.memberId} -> ${data.payload}`);
            if (data.memberId) {
                let isMuted = false;
                if (data.payload) {
                    try {
                        const payloadObj = JSON.parse(data.payload);
                        if (typeof payloadObj.isMuted === 'boolean') {
                            isMuted = payloadObj.isMuted;
                        } else if (payloadObj.isMuted === 'true') { // Fallback for safety
                            isMuted = true;
                        }
                    } catch (e) {
                        // Fallback for backward compatibility or raw string
                        isMuted = data.payload === 'true';
                    }
                }

                setParticipants(prev => prev.map(p =>
                    p.memberId === data.memberId ? { ...p, isMuted } : p
                ));
            }
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const newMutedState = !isMuted;
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
            setIsMuted(newMutedState);

            if (stompClientRef.current && noteId) {
                stompClientRef.current.publish({
                    destination: '/app/webrtc/mute',
                    body: JSON.stringify({
                        noteId,
                        isMuted: newMutedState
                    })
                });
            }
        }
    };

    const setVolume = (newVolume: number) => {
        const clamped = Math.max(0, Math.min(1, newVolume));
        setVolumeState(clamped);
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = clamped;
        }
    };

    const setInputVolume = (newVolume: number) => {
        const clamped = Math.max(0, Math.min(2, newVolume));
        setInputVolumeState(clamped);
    };

    // [Fix] Update GainNode when inputVolume changes
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = inputVolume;
        }
    }, [inputVolume]);

    // 1. Socket Connection Effect
    useEffect(() => {
        if (!token || !noteId || !memberId) return;

        // Connect Socket
        const client = new Client({
            brokerURL: SIGNALING_SERVER_URL,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                log('STOMP connected');
                setSocketConnected(true);

                // Subscribe to Room Topic
                client.subscribe(`/topic/room/${noteId}`, (message) => {
                    handleRoomMessage(JSON.parse(message.body));
                });

                // Subscribe to Private Queue
                client.subscribe(`/user/queue/webrtc`, (message) => {
                    handleSignalingMessage(JSON.parse(message.body));
                });

                // Subscribe to ICE candidates
                client.subscribe(`/user/queue/webrtc/ice`, (message) => {
                    handleIceCandidateMessage(JSON.parse(message.body));
                });

                // Subscribe to Answer
                client.subscribe(`/user/queue/webrtc/answer`, (message) => {
                    handleAnswerMessage(JSON.parse(message.body));
                });

                // Request initial participant list (Observer Mode)
                client.publish({
                    destination: '/app/webrtc/participants',
                    body: JSON.stringify({ noteId })
                });

                // If onConnect callback was passed
                onConnect?.();
            },
            onStompError: (frame) => {
                errorLog('Broker reported error: ' + frame.headers['message']);
                errorLog('Additional details: ' + frame.body);
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            // Cleanup on unmount or note change
            leaveVoice(); // Ensure voice is left
            client.deactivate();
            log('STOMP disconnected');
            setSocketConnected(false);
            setParticipants([]);
        };
    }, [noteId, token, memberId]);

    return {
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
    };
};
