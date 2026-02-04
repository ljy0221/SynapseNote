package com.synapse.api.modules.note.dto.request;

import com.synapse.api.modules.note.entity.NoteRole;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record InvitationCreateRequest(
                String invitedEmail,

                @NotNull(message = "권한은 필수입니다") NoteRole role) {
}
