package com.synapse.api.modules.member.dto.response;

import lombok.Builder;

@Builder
public record LoginResult(
        LoginResponse response,
        String refreshToken
) {
}
