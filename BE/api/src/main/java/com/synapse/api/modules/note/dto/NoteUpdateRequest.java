package com.synapse.api.modules.note.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record NoteUpdateRequest(
        @NotBlank(message = "노트 제목은 필수입니다")
        @Size(max = 200, message = "노트 제목은 200자를 초과할 수 없습니다")
        String title,

        @Size(max = 500, message = "디렉토리 경로는 500자를 초과할 수 없습니다")
        String directoryPath,

        String content
) {
}