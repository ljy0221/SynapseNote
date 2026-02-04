package com.synapse.api.modules.webrtc.config;

import com.synapse.api.util.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * STOMP Channel Interceptor for JWT Authentication
 * STOMP CONNECT 프레임에서 JWT 토큰을 검증하고 세션에 memberId를 저장
 * 
 * 이것이 WebRTC 시그널링의 유일한 인증 지점입니다 (STOMP 표준)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // STOMP CONNECT 명령에서만 인증 수행
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("[WebRTC Auth] STOMP CONNECT rejected: Missing or invalid Authorization header");
                throw new IllegalArgumentException("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7); // "Bearer " 제거

            try {
                UUID memberId = jwtUtil.getId(token);

                if (memberId == null) {
                    log.warn("[WebRTC Auth] STOMP CONNECT rejected: Invalid token (null memberId)");
                    throw new IllegalArgumentException("Invalid token");
                }

                // 세션 속성에 memberId 저장 (이후 모든 메시지에서 사용 가능)
                accessor.getSessionAttributes().put("memberId", memberId);

                // Principal 설정 (convertAndSendToUser()가 이 값을 사용함)
                accessor.setUser(() -> memberId.toString());

                log.debug("[WebRTC Auth] STOMP CONNECT authenticated for member: {}, session: {}",
                        memberId, accessor.getSessionId());

                return message;

            } catch (Exception e) {
                log.error("[WebRTC Auth] STOMP CONNECT rejected: Token validation failed", e);
                throw new IllegalArgumentException("Token validation failed: " + e.getMessage());
            }
        }

        return message;
    }
}
