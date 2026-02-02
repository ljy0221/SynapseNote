package com.synapse.api.modules.member.dto.oauth;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.synapse.api.util.entity.EnumParser;

public enum OAuthProvider {
    GOOGLE, GITHUB;

    @JsonCreator
    public static OAuthProvider from(String value) {
        return EnumParser.fromString(value, OAuthProvider.class);
    }

}

