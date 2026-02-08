package com.synapse.api.modules.webrtc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.Composite;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.kurento.client.WebRtcEndpoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.kurento.client.HubPort;

/**
 * WebRTC 룸 관리 서비스
 * 노트별로 WebRTC 세션을 관리하고 Kurento Media Pipeline을 생성/해제
 */
@Slf4j
@Service
public class WebRtcRoomManager {

    @Autowired(required = false)
    private KurentoClient kurentoClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // noteId -> Room
    private final Map<UUID, Room> rooms = new ConcurrentHashMap<>();

    // memberId -> Set<noteId> (사용자가 참여 중인 룸 목록)
    private final Map<UUID, Set<UUID>> userRoomMap = new ConcurrentHashMap<>();

    /**
     * 사용자가 룸에 참여
     */
    public void joinRoom(UUID noteId, UUID memberId, String name) {
        Room room = rooms.computeIfAbsent(noteId, id -> {
            log.info("Creating new WebRTC room for note: {}", id);

            // Kurento가 없으면 null pipeline로 생성 (로컬 테스트용)
            MediaPipeline pipeline = null;
            if (kurentoClient != null) {
                try {
                    pipeline = kurentoClient.createMediaPipeline();
                    log.info("[Kurento] Media Pipeline created successfully! Pipeline ID: {}", pipeline.getId());
                } catch (Exception e) {
                    log.error("[Kurento] Failed to create Media Pipeline", e);
                }
            } else {
                log.warn("[Kurento] KurentoClient is null. Running in TEST MODE (No Media Server).");
            }

            return new Room(id, pipeline);
        });

        room.addParticipant(memberId, name);

        // 사용자-룸 매핑 추가
        userRoomMap.computeIfAbsent(memberId, k -> ConcurrentHashMap.newKeySet()).add(noteId);

        log.info("User {} ({}) joined room {}", memberId, name, noteId);
    }

    /**
     * 사용자가 룸에서 퇴장
     */
    public void leaveRoom(UUID noteId, UUID memberId) {
        Room room = rooms.get(noteId);
        if (room != null) {
            room.removeParticipant(memberId);
            log.info("User {} left room {}", memberId, noteId);

            // 사용자-룸 매핑에서 제거
            Set<UUID> userRooms = userRoomMap.get(memberId);
            if (userRooms != null) {
                userRooms.remove(noteId);
                // 사용자가 더 이상 참여 중인 룸이 없으면 맵에서 제거
                if (userRooms.isEmpty()) {
                    userRoomMap.remove(memberId);
                }
            }

            // 룸이 비어있으면 정리
            if (room.isEmpty()) {
                room.release();
                rooms.remove(noteId);
                log.info("Room {} is empty and has been released", noteId);
            }
        }
    }

    /**
     * 모든 룸에서 사용자 제거 (연결 해제 시)
     */
    public void removeUserFromAllRooms(UUID memberId) {
        Set<UUID> userRooms = userRoomMap.get(memberId);

        if (userRooms != null) {
            // 사용자가 참여 중인 룸만 순회 (전체 룸 순회 X)
            userRooms.forEach(noteId -> {
                Room room = rooms.get(noteId);
                if (room != null && room.hasParticipant(memberId)) {
                    leaveRoom(noteId, memberId);
                }
            });

            log.info("Removed user {} from {} rooms", memberId, userRooms.size());
        } else {
            log.debug("User {} was not in any rooms", memberId);
        }
    }

    /**
     * 특정 룸 가져오기
     */
    public Room getRoom(UUID noteId) {
        return rooms.get(noteId);
    }

    /**
     * WebRTC 룸 클래스
     */
    @Getter
    public static class Room {
        private final UUID noteId;
        private final MediaPipeline pipeline;
        private final Composite composite;
        private final Map<UUID, Participant> participants = new ConcurrentHashMap<>();

        public Room(UUID noteId, MediaPipeline pipeline) {
            this.noteId = noteId;
            this.pipeline = pipeline;
            if (pipeline != null) {
                // 다자간 음성 믹싱을 위한 Composite 생성
                this.composite = new Composite.Builder(pipeline).build();
            } else {
                this.composite = null;
            }
        }

        public void addParticipant(UUID memberId, String name) {
            WebRtcEndpoint endpoint = null;
            HubPort hubPort = null;

            if (pipeline != null) {
                endpoint = new WebRtcEndpoint.Builder(pipeline).build();
                hubPort = new HubPort.Builder(composite).build();

                // 양방향 연결 (User <-> Mixer)
                endpoint.connect(hubPort);
                hubPort.connect(endpoint);
            }

            Participant participant = new Participant(memberId, name, endpoint, hubPort);
            participants.put(memberId, participant);
        }

        public void removeParticipant(UUID memberId) {
            Participant participant = participants.remove(memberId);
            if (participant != null) {
                if (participant.getEndpoint() != null) {
                    participant.getEndpoint().release();
                }
                if (participant.getHubPort() != null) {
                    participant.getHubPort().release();
                }
            }
        }

        public Participant getParticipant(UUID memberId) {
            return participants.get(memberId);
        }

        public boolean isEmpty() {
            return participants.isEmpty();
        }

        public boolean hasParticipant(UUID memberId) {
            return participants.containsKey(memberId);
        }

        public Set<UUID> getParticipantIds() {
            return participants.keySet();
        }

        public List<ParticipantInfo> getParticipantInfos() {
            return participants.values().stream()
                    .map(p -> new ParticipantInfo(p.getMemberId(), p.getName(), p.isMuted()))
                    .collect(java.util.stream.Collectors.toList());
        }

        public void release() {
            participants.values().forEach(p -> {
                if (p.getEndpoint() != null) {
                    p.getEndpoint().release();
                }
                if (p.getHubPort() != null) {
                    p.getHubPort().release();
                }
            });
            participants.clear();

            if (composite != null) {
                composite.release();
            }
            if (pipeline != null) {
                pipeline.release();
            }
        }
    }

    /**
     * 참여자 클래스
     */
    @Getter
    public static class Participant {
        private final UUID memberId;
        private final String name;
        private final WebRtcEndpoint endpoint;
        private final HubPort hubPort;
        private boolean isMuted = false;

        public Participant(UUID memberId, String name, WebRtcEndpoint endpoint, HubPort hubPort) {
            this.memberId = memberId;
            this.name = name;
            this.endpoint = endpoint;
            this.hubPort = hubPort;
        }

        public void setMuted(boolean muted) {
            this.isMuted = muted;
        }
    }

    @Getter
    @AllArgsConstructor
    public static class ParticipantInfo {
        private UUID memberId;
        private String name;
        private boolean isMuted;
    }
}
