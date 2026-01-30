package com.synapse.api.modules.user.dto.oauth;

public record GithubEmail(
        String email,
        boolean primary,
        boolean verified,
        String visibility
) {
}
