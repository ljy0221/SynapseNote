package com.synapse.api.modules.user.dto.oauth;

public interface OAuthUserInfo {
    String getProviderId();
    String getEmail();
    String getName();
    OAuthProvider getProvider();
}

