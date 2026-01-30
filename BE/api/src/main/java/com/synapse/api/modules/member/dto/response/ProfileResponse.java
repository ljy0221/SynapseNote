package com.synapse.api.modules.member.dto.response;

import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ProfileResponse(
        String email,
        String name,
        OAuthProvider provider,
        LocalDateTime createdAt
) {
}
