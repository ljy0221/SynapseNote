package com.synapse.api.modules.member.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateThemeRequest(
    @NotNull(message = "테마 설정값은 필수입니다")
    Boolean isLight
) {
}
