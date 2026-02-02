package com.synapse.api.modules.member.dto.response;

import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record ProfileResponse(
        UUID id,
        String email,
        String name,
        boolean isLight,
        OAuthProvider provider,
        LocalDateTime createdAt
) {
}
