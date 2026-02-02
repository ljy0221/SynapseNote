package com.synapse.api.modules.webrtc.controller;

import com.synapse.api.modules.webrtc.dto.request.*;
import com.synapse.api.modules.webrtc.dto.response.*;
import com.synapse.api.modules.webrtc.service.WebRtcRoomManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.IceCandidate;
import org.kurento.client.WebRtcEndpoint;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

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

    /**
     * 룸 참여
     * 클라이언트: /app/webrtc/join
     */
    @MessageMapping("/webrtc/join")
    public void joinRoom(@Payload JoinRoomRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        String noteId = request.getNoteId();

        log.info("Member {} joining room {}", memberId, noteId);

        // 룸 생성 및 참여 (Kurento Pipeline 생성)
        roomManager.joinRoom(noteId, memberId);

        // 참여 확인 메시지 전송
        SignalingMessage response = new SignalingMessage();
        response.setType("JOINED");
        response.setNoteId(noteId);
        response.setMemberId(memberId);

        // 해당 사용자에게만 응답
        messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc", response);

        // 같은 룸의 다른 사용자들에게 알림
        SignalingMessage notification = new SignalingMessage();
        notification.setType("USER_JOINED");
        notification.setNoteId(noteId);
        notification.setMemberId(memberId);

        messagingTemplate.convertAndSend("/topic/room/" + noteId, notification);
    }

    /**
     * SDP Offer 처리
     * 클라이언트: /app/webrtc/offer
     */
    @MessageMapping("/webrtc/offer")
    public void handleOffer(@Payload OfferRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        String noteId = request.getNoteId();

        log.info("Received offer from member {} in room {}", memberId, noteId);

        WebRtcRoomManager.Room room = roomManager.getRoom(noteId);
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
            IceCandidateMessage iceMsg = new IceCandidateMessage(
                    event.getCandidate().getCandidate(),
                    event.getCandidate().getSdpMid(),
                    event.getCandidate().getSdpMLineIndex());

            messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc/ice", iceMsg);
        });

        // SDP Answer 생성
        String sdpAnswer = endpoint.processOffer(request.getSdp());
        endpoint.gatherCandidates();

        // Answer 응답
        AnswerMessage answerMessage = new AnswerMessage(sdpAnswer);
        messagingTemplate.convertAndSendToUser(memberId.toString(), "/queue/webrtc/answer", answerMessage);

        log.info("[WebRTC] Sent ANSWER to member {} in room {}", memberId, noteId);
        log.info("[WebRTC] SDP Answer: {}", sdpAnswer.substring(0, Math.min(sdpAnswer.length(), 50)) + "...");
    }

    /**
     * ICE Candidate 처리
     * 클라이언트: /app/webrtc/ice
     */
    @MessageMapping("/webrtc/ice")
    public void handleIceCandidate(@Payload IceCandidateRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        String noteId = request.getNoteId();

        log.debug("Received ICE candidate from member {} in room {}", memberId, noteId);

        WebRtcRoomManager.Room room = roomManager.getRoom(noteId);
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
        log.debug("Added ICE candidate for member {} in room {}", memberId, noteId);
    }

    /**
     * 룸 퇴장
     * 클라이언트: /app/webrtc/leave
     */
    @MessageMapping("/webrtc/leave")
    public void leaveRoom(@Payload LeaveRoomRequest request, SimpMessageHeaderAccessor headerAccessor) {
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        String noteId = request.getNoteId();

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
