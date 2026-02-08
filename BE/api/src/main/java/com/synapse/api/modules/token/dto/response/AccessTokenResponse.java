package com.synapse.api.modules.token.dto.response;

import lombok.Builder;

@Builder
public record AccessTokenResponse(
        String accessToken
) {
}
