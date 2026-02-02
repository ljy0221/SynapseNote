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

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    UUID memberId = jwtUtil.getId(token);
                    if (memberId != null) {
                        log.info("STOMP Connection Authenticated for Member: {}", memberId);
                        // 인증 정보를 세션에 저장하거나 User Principal을 설정할 수 있음
                        // accessor.setUser(new UserPrincipal(userId));

                        // memberId를 세션 속성에 저장
                        accessor.getSessionAttributes().put("memberId", memberId);
                        return message;
                    }
                } catch (Exception e) {
                    log.error("Token validation failed", e);
                }
            }
            log.warn("STOMP Connection Rejected: Missing or Invalid Token");
            throw new IllegalArgumentException("Invalid Token");
        }
        return message;
    }
}
