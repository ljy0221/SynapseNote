package com.synapse.api.modules.user.dto.response;

import com.synapse.api.modules.user.dto.oauth.OAuthProvider;
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
