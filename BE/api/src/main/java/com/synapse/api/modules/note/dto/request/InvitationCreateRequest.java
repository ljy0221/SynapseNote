package com.synapse.api.modules.note.dto.request;

import com.synapse.api.modules.note.entity.NoteRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record InvitationCreateRequest(
        @NotBlank(message = "초대할 이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        String invitedEmail,

        @NotNull(message = "권한은 필수입니다")
        NoteRole role
) {
}
