package com.synapse.api.modules.user.dto.request;

import com.synapse.api.modules.user.dto.oauth.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        @NotNull(message = "Provider must not be blank")
        OAuthProvider provider,

        @NotBlank(message = "Authorization code must not be blank")
        String authorizationCode
) {
}
