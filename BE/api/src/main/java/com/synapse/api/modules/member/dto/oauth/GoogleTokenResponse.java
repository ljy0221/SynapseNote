package com.synapse.api.modules.member.dto.oauth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleTokenResponse(
        @JsonProperty("access_token")
        String accessToken,

        @JsonProperty("refresh_token")
        String refreshToken,

        String scope,

        @JsonProperty("token_type")
        String tokenType,

        @JsonProperty("expires_in")
        int expiresIn,

        @JsonProperty("id_token")
        String idToken
) {
}

