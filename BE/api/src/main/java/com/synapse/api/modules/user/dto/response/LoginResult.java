package com.synapse.api.modules.user.dto.response;

import lombok.Builder;

@Builder
public record LoginResult(
        String accessToken,
        String refreshToken,
        boolean sessionReplaced
) {
}
