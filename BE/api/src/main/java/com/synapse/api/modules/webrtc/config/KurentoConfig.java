package com.synapse.api.modules.webrtc.config;

import org.kurento.client.KurentoClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Kurento Media Server 클라이언트 설정
 */
@Configuration
public class KurentoConfig {

    @Value("${kurento.ws.url:ws://localhost:8888/kurento}")
    private String kurentoWsUrl;

    @Bean
    @ConditionalOnProperty(name = "kurento.enabled", havingValue = "true", matchIfMissing = true)
    public KurentoClient kurentoClient() {
        return KurentoClient.create(kurentoWsUrl);
    }
}
