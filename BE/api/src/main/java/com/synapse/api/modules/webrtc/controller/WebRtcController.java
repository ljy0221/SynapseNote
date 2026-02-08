package com.synapse.api.modules.webrtc.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.webrtc.dto.request.*;
import com.synapse.api.modules.webrtc.dto.response.*;

import com.synapse.api.modules.webrtc.service.WebRtcRoomManager;
import com.synapse.api.modules.webrtc.service.WebRtcRoomManager.Room;
import com.synapse.api.modules.webrtc.service.WebRtcService;
import com.synapse.api.util.exception.BusinessException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.IceCandidate;
import org.kurento.client.WebRtcEndpoint;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * WebRTC STOMP Controller
 * 클라이언트로부터 STOMP 메시지를 받아 처리
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebRtcController {

    private final WebRtcRoomManager roomManager;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebRtcService webRtcService;
    private final ObjectMapper objectMapper;

    /**
     * 룸 참여
     * 클라이언트: /app/webrtc/join
     */
    @MessageMapping("/webrtc/join")
    public void joinRoom(@Payload JoinRoomRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        UUID noteId = request.getNoteId();

        log.info("Member {} joining room {}", memberId, noteId);

        // 노트 멤버십 확인 및 이름 조회 (트랜잭션 처리)
        String memberName;
        try {
            memberName = webRtcService.validateAndGetMemberName(noteId, memberId);
        } catch (BusinessException e) {
            sendError(memberId, "Access denied: You are not a member of this note.");
            throw e;
        }

        // Room Manager에 참여 처리
        roomManager.joinRoom(noteId, memberId, memberName);

        // 본인에게 JOINED 메시지 전송 (클라이언트 Offer 트리거용)
        try {
            Room room = roomManager.getRoom(noteId);
            List<WebRtcRoomManager.ParticipantInfo> participants = (room != null) ? room.getParticipantInfos()
                    : Collections.emptyList();

            String participantsJson = objectMapper.writeValueAsString(participants);

            SignalingMessage joinedMsg = new SignalingMessage();
            joinedMsg.setType("JOINED");
            joinedMsg.setNoteId(noteId);
            joinedMsg.setMemberId(memberId);
            joinedMsg.setPayload(participantsJson);
            joinedMsg.setStatus("READY");

            messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc", joinedMsg);
            log.info("Sent JOINED confirmation to member {}", memberId);
        } catch (Exception e) {
            log.error("Failed to send JOINED confirmation", e);
        }

        // 같은 룸의 다른 사용자들에게 알림
        WebRtcRoomManager.ParticipantInfo newParticipantInfo = new WebRtcRoomManager.ParticipantInfo(memberId,
                memberName, false);

        try {
            String payload = objectMapper.writeValueAsString(newParticipantInfo);

            SignalingMessage notification = new SignalingMessage();
            notification.setType("USER_JOINED");
            notification.setNoteId(noteId);
            notification.setMemberId(memberId);
            notification.setPayload(payload);

            messagingTemplate.convertAndSend("/topic/room/" + noteId, notification);
        } catch (Exception e) {
            log.error("Failed to serialize new participant info for USER_JOINED. Skipping notification.", e);
        }
    }

    /**
     * Mute 상태 변경 처리
     * 클라이언트: /app/webrtc/mute
     */
    @MessageMapping("/webrtc/mute")
    public void handleMute(@Payload MuteRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        UUID noteId = request.getNoteId();
        boolean isMuted = request.isMuted();

        log.info("Member {} changed mute status to {} in room {}", memberId, isMuted, noteId);

        Room room = roomManager.getRoom(noteId);
        if (room != null) {
            WebRtcRoomManager.Participant participant = room.getParticipant(memberId);
            if (participant != null) {
                participant.setMuted(isMuted);

                // 다른 사용자들에게 알림
                try {
                    String payload = objectMapper
                            .writeValueAsString(Collections.singletonMap("isMuted", isMuted));

                    SignalingMessage notification = new SignalingMessage();
                    notification.setType("USER_MUTE_CHANGED");
                    notification.setNoteId(noteId);
                    notification.setMemberId(memberId);
                    notification.setPayload(payload); // JSON String

                    messagingTemplate.convertAndSend("/topic/room/" + noteId, notification);
                } catch (Exception e) {
                    log.error("Failed to serialize mute status", e);
                }
            }
        }
    }

    /**
     * SDP Offer 처리
     * 클라이언트: /app/webrtc/offer
     */
    @MessageMapping("/webrtc/offer")
    public void handleOffer(@Payload OfferRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        UUID noteId = request.getNoteId();
        String callId = request.getCallId(); // 클라이언트가 보낸 요청 ID

        log.info("Received offer from member {} in room {}, callId: {}", memberId, noteId, callId);

        Room room = roomManager.getRoom(noteId);
        if (room == null) {
            sendError(memberId, "Room not found: " + noteId);
            return;
        }

        WebRtcRoomManager.Participant participant = room.getParticipant(memberId);
        if (participant == null) {
            sendError(memberId, "Participant not found in room");
            return;
        }

        WebRtcEndpoint endpoint = participant.getEndpoint();
        if (endpoint == null) {
            // Kurento 없이 테스트 모드
            log.warn("Kurento endpoint not available for member {}", memberId);
            return;
        }

        // ICE Candidate 이벤트 리스너 등록
        endpoint.addIceCandidateFoundListener(event -> {
            String candidateStr = event.getCandidate().getCandidate();
            log.info("[Kurento] Generated ICE candidate for user {}: {}", memberId, candidateStr);

            IceCandidateMessage iceMsg = new IceCandidateMessage(
                    noteId, // noteId 포함
                    candidateStr,
                    event.getCandidate().getSdpMid(),
                    event.getCandidate().getSdpMLineIndex());

            messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc/ice", iceMsg);
        });

        // SDP Answer 생성
        String sdpAnswer = endpoint.processOffer(request.getSdp());
        endpoint.gatherCandidates();

        // Answer 응답 (noteId, callId 포함)
        AnswerMessage answerMessage = new AnswerMessage(noteId, callId, sdpAnswer);
        String answerDest = "/queue/webrtc/answer";
        log.debug("[WebRTC] Sending ANSWER to user: {}, destination: /user/{}{}, callId: {}",
                memberId, memberId, answerDest, callId);
        messagingTemplate.convertAndSendToUser(memberId.toString(), answerDest, answerMessage);

        log.info("[WebRTC] Sent ANSWER to member {} in room {}, callId: {}", memberId, noteId, callId);
        log.debug("[WebRTC] SDP Answer length: {}", sdpAnswer.length());
    }

    /**
     * ICE Candidate 처리
     * 클라이언트: /app/webrtc/ice
     */
    @MessageMapping("/webrtc/ice")
    public void handleIceCandidate(@Payload IceCandidateRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        UUID noteId = request.getNoteId();
        String callId = request.getCallId();

        log.info("Received ICE candidate from member {} in room {}, callId: {}. Candidate: {}",
                memberId, noteId, callId, request.getCandidate());

        Room room = roomManager.getRoom(noteId);
        if (room == null) {
            sendError(memberId, "Room not found: " + noteId);
            return;
        }

        WebRtcRoomManager.Participant participant = room.getParticipant(memberId);
        if (participant == null) {
            sendError(memberId, "Participant not found in room");
            return;
        }

        WebRtcEndpoint endpoint = participant.getEndpoint();
        if (endpoint == null) {
            log.warn("Kurento endpoint not available for member {}", memberId);
            return;
        }

        IceCandidate candidate = new IceCandidate(
                request.getCandidate(),
                request.getSdpMid(),
                request.getSdpMLineIndex());

        endpoint.addIceCandidate(candidate);
        log.info("Added ICE candidate for member {} in room {}", memberId, noteId);
    }

    /**
     * 룸 퇴장
     * 클라이언트: /app/webrtc/leave
     */
    @MessageMapping("/webrtc/leave")
    public void leaveRoom(@Payload LeaveRoomRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        UUID noteId = request.getNoteId();

        log.info("Member {} leaving room {}", memberId, noteId);

        roomManager.leaveRoom(noteId, memberId);

        // 같은 룸의 다른 사용자들에게 알림
        SignalingMessage notification = new SignalingMessage();
        notification.setType("USER_LEFT");
        notification.setNoteId(noteId);
        notification.setMemberId(memberId);

        messagingTemplate.convertAndSend("/topic/room/" + noteId, notification);
    }

    /**
     * 현재 참여자 목록 조회 (Join 없이)
     * 클라이언트: /app/webrtc/participants
     */
    @MessageMapping("/webrtc/participants")
    public void getParticipants(@Payload ParticipantListRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        UUID noteId = request.getNoteId();

        Room room = roomManager.getRoom(noteId);
        List<WebRtcRoomManager.ParticipantInfo> participants;

        if (room != null) {
            participants = room.getParticipantInfos();
        } else {
            participants = Collections.emptyList();
        }

        SignalingMessage response = new SignalingMessage();
        response.setType("PARTICIPANT_LIST");
        response.setNoteId(noteId);
        try {
            response.setPayload(objectMapper.writeValueAsString(participants));
        } catch (Exception e) {
            log.error("Failed to serialize participant list", e);
            response.setPayload("[]");
        }

        messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc", response);
    }

    /**
     * 에러 메시지 전송
     */
    private void sendError(UUID memberId, String errorMessage) {
        log.error("Sending Error to member {}: {}", memberId, errorMessage);
        SignalingMessage error = new SignalingMessage();
        error.setType("ERROR");
        error.setPayload(errorMessage);

        messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc", error);
    }
}
