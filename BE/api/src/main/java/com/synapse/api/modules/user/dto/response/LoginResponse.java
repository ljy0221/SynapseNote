package com.synapse.api.modules.user.dto.response;

import lombok.Builder;

@Builder
public record LoginResponse(
    String accessToken,
    boolean sessionReplaced
) {
}
