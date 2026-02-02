package com.synapse.api.modules.member.dto.response;

import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import com.synapse.api.modules.member.entity.Theme;
import lombok.Builder;

import java.util.UUID;

@Builder
public record LoginResponse(
    String accessToken,
    boolean isNewMember,
    Member member,
    boolean sessionReplaced
) {
    @Builder
    public record Member (
            UUID id,
            String email,
            String name,
            Theme theme,
            OAuthProvider provider
    ) {
    }
}
