package com.synapse.api.modules.member.dto.oauth;

public interface OAuthUserInfo {
    String getProviderId();
    String getEmail();
    String getName();
    OAuthProvider getProvider();
}

