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
    }, [noteId, memberId, status]);

    /**
     * 구독 설정
     */
    const subscribeToSignaling = (client: Client) => {
        // 1. Personal Signaling (Existing)
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

        // 2. Room Broadcasting (New: Participants)
        if (noteId) {
            client.subscribe(`/topic/room/${noteId}`, (message: IMessage) => {
                const data: SignalingMessage = JSON.parse(message.body);
                handleRoomMessage(data);
            });
        }
    };

    /**
     * Room Topic 메시지 핸들러 (USER_JOINED, USER_LEFT)
     */
    const handleRoomMessage = (data: SignalingMessage) => {
        if (data.type === 'USER_JOINED') {
            log(`User joined: ${data.memberId}`);
            if (data.memberId && data.memberId !== memberId) {
                setParticipants(prev => {
                    // 중복 방지
                    if (prev.some(p => p.memberId === data.memberId)) return prev;
                    return [...prev, {
                        memberId: data.memberId!,
                        status: 'connected',
                        isMuted: false,
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
        }
    };

    /**
     * 방 참여 요청 및 미디어 획득
     */


    const createPeerConnection = (stream: MediaStream) => {
        if (peerConnectionRef.current) return;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
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

    const handleSignalingMessage = async (data: SignalingMessage) => {
        if (data.type === 'JOINED') {
            log('Room join confirmed by server. Ready to offer.');

            // [Snapshot] 초기 참여자 목록 설정
            if (data.payload) {
                try {
                    // Backend sends List<ParticipantInfo> { memberId: UUID, isMuted: boolean }
                    const initialMembers: { memberId: string, isMuted: boolean }[] = JSON.parse(data.payload);
                    log(`Initial participants: ${initialMembers.length}`);

                    setParticipants(prev => {
                        const newParticipants = initialMembers
                            .filter(m => m.memberId !== memberId)
                            .map(m => ({
                                memberId: m.memberId,
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
        }
    };

    // ... (createAndSendOffer, handleAnswerMessage, handleIceCandidateMessage, toggleMute - same as before)
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
            const newMutedState = !isMuted;

            // 1. Local Track Control
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
            setIsMuted(newMutedState);

            // 2. Server Sync
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

    // [Note] Disconnect when noteId changes or component unmounts
    // Audio Context for Input Volume Processing
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    const [volume, setVolumeState] = useState(1.0); // Output Volume
    const [inputVolume, setInputVolumeState] = useState(1.0); // Input Volume (Mic)



    const setVolume = (newVolume: number) => {
        const clamped = Math.max(0, Math.min(1, newVolume));
        setVolumeState(clamped);
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = clamped;
        }
    };

    const setInputVolume = (newVolume: number) => {
        // Allow amplification up to 2.0x
        const clamped = Math.max(0, Math.min(2, newVolume));
        setInputVolumeState(clamped);
        // The actual update is handled by the useEffect below
    };

    // [Fix] Update GainNode when inputVolume changes
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = inputVolume;
        }
    }, [inputVolume]);

    // ... (rest of hook) has become very complex.
    // I will replace specific blocks to achieve the decoupling.

    // 1. Socket Connection Effect
    useEffect(() => {
        if (!accessToken || !noteId || !user.memberId) return;

        // Connect Socket
        const client = new Client({
            brokerURL: `${import.meta.env.VITE_WS_URL}/ws-stomp`, // Using WS_URL env
            connectHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                log('STOMP connected');
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
            setParticipants([]);
        };
    }, [noteId, accessToken, user.memberId]);

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

    // ... handleSignalingMessage updates ...
    const handleSignalingMessage = async (data: SignalingMessage) => {
        // ... existing switch ...
        if (data.type === 'PARTICIPANT_LIST') {
            if (data.payload) {
                try {
                    const initialMembers: { memberId: string, isMuted: boolean }[] = JSON.parse(data.payload);
                    const mapped = initialMembers.map(m => ({
                        memberId: m.memberId,
                        isMuted: m.isMuted,
                        // stream is undefined for remote initially
                    }));
                    setParticipants(mapped);
                    log(`Loaded ${mapped.length} participants (Observer Mode)`);
                } catch (e) {
                    errorLog('Failed to parse participant list', e);
                }
            }
        }
        // ... JOINED logic needs to be careful not to double-add or overwrite if we already have the list
        // Actually JOINED gives the *full* snapshot too? Yes.
        // So we can reuse the same logic or just rely on updates.
        else if (data.type === 'JOINED') {
            if (data.payload) {
                try {
                    const initialMembers: { memberId: string, isMuted: boolean }[] = JSON.parse(data.payload);
                    const mapped = initialMembers.map(m => ({
                        memberId: m.memberId,
                        isMuted: m.isMuted,
                    }));
                    setParticipants(mapped);
                    setStatus('connected'); // IMPORTANT: This confirms WE joined
                } catch (e) {
                    errorLog('Error parsing JOINED snapshot', e);
                }
            }
        }
        // ...
    };

    // ...

    return {
        status, // 'connecting' | 'connected' (Voice) | 'disconnected'
        joinVoice,
        leaveVoice,
        toggleMute,
        isMuted,
        participants,
        volume,
        setVolume,
        inputVolume,
        setInputVolume
    };
};
