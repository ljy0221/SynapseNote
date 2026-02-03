package com.synapse.api.modules.webrtc.config;

import com.synapse.api.modules.webrtc.service.WebRtcRoomManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.UUID;

/**
 * WebSocket 세션 이벤트 리스너
 * 연결/해제 시 자동으로 룸 참여/퇴장 처리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final WebRtcRoomManager roomManager;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");

        log.info("WebSocket connected: sessionId={}, memberId={}",
                headerAccessor.getSessionId(), memberId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UUID memberId = (UUID) headerAccessor.getSessionAttributes().get("memberId");
        String sessionId = headerAccessor.getSessionId();

        log.info("WebSocket disconnected: sessionId={}, memberId={}", sessionId, memberId);

        // 모든 룸에서 해당 사용자 제거
        if (memberId != null) {
            roomManager.removeUserFromAllRooms(memberId);
        }
    }
}
