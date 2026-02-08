package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuthServiceFactory {

    private final Map<String, OAuthService> services;

    public OAuthService getService(OAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> services.get("googleOAuthService");
            case GITHUB -> services.get("githubOAuthService");
        };
    }

}

