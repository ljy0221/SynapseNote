package com.synapse.api.modules.webrtc.config;

import com.synapse.api.util.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.UUID;

/**
 * WebSocket Handshake 시 JWT 토큰 검증
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {

        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;

            // Authorization 헤더에서 토큰 추출
            // Authorization 헤더에서 토큰 추출
            String authHeader = servletRequest.getServletRequest().getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("WebSocket connection rejected: Missing or invalid Authorization header");
                return false;
            }

            String token = authHeader.substring(7); // "Bearer " 제거

            try {
                // JWT 토큰 검증
                UUID userId = jwtUtil.getId(token);

                if (userId == null) {
                    log.warn("WebSocket connection rejected: Invalid token");
                    return false;
                }

                // WebSocket Session Attributes에 userId 저장 (String으로 변환)
                attributes.put("userId", userId.toString());
                log.info("WebSocket handshake successful for user: {}", userId);
                return true;

            } catch (Exception e) {
                log.error("WebSocket connection rejected: Token validation failed", e);
                return false;
            }
        }

        log.warn("WebSocket connection rejected: Invalid request type");
        return false;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // Handshake 후 처리
    }
}
