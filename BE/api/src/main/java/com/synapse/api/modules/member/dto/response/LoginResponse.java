package com.synapse.api.modules.member.dto.response;

import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import lombok.Builder;

@Builder
public record LoginResponse(
    String accessToken,
    boolean isNewMember,
    Member member,
    boolean sessionReplaced
) {
    @Builder
    public record Member (
            String email,
            String name,
            OAuthProvider provider
    ) {
    }
}
