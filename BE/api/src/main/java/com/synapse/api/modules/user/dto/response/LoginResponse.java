package com.synapse.api.modules.user.dto.response;

import com.synapse.api.modules.user.dto.oauth.OAuthProvider;
import lombok.Builder;

@Builder
public record LoginResponse(
    String accessToken,
    boolean isNewUser,
    User user,
    boolean sessionReplaced
) {
    @Builder
    public record User (
            String email,
            String name,
            OAuthProvider provider
    ) {
    }
}
