package com.synapse.api.modules.member.dto.oauth;

public record GithubEmail(
        String email,
        boolean primary,
        boolean verified,
        String visibility
) {
}
