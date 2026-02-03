package com.synapse.api.modules.webrtc.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket STOMP 설정
 * WebRTC 시그널링을 위한 STOMP 엔드포인트 및 메시지 브로커 설정
 * 
 * 인증은 JwtChannelInterceptor에서 STOMP CONNECT 프레임 처리 시 수행됨
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple Broker 활성화: 클라이언트가 구독할 목적지
        registry.enableSimpleBroker("/topic", "/queue");

        // Application Destination Prefix: 클라이언트가 메시지를 보낼 목적지
        registry.setApplicationDestinationPrefixes("/app");

        // User Destination Prefix: 특정 사용자에게 메시지 전송
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 엔드포인트 등록
        // 인증은 STOMP CONNECT 프레임에서 JwtChannelInterceptor가 처리
        registry.addEndpoint("/webrtc")
                .setAllowedOriginPatterns("*");
        // .withSockJS(); // SockJS 제거
    }

    @Override
    public void configureClientInboundChannel(
            org.springframework.messaging.simp.config.ChannelRegistration registration) {
        // STOMP CONNECT 프레임에서 JWT 인증 수행
        registration.interceptors(jwtChannelInterceptor);
    }
}
