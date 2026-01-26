package com.synapse.api.module.note.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotePositionUpdateRequest {

    @NotNull(message = "X 좌표는 필수입니다")
    private Double pointX;

    @NotNull(message = "Y 좌표는 필수입니다")
    private Double pointY;
}
