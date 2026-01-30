package com.synapse.api.modules.member.dto.oauth;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OAuthProvider {
    GOOGLE, GITHUB;

    @JsonCreator
    public static OAuthProvider from(String value) {
        return OAuthProvider.valueOf(value.toUpperCase());
    }

}

