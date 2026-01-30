package com.synapse.api.modules.note.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record NotePositionUpdateRequest(
        @NotNull(message = "X 좌표는 필수입니다")
        Double pointX,

        @NotNull(message = "Y 좌표는 필수입니다")
        Double pointY
) {
}