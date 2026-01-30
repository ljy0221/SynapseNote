package com.synapse.api.modules.note.dto.response;

import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteRole;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record NoteMemberResponse(
        UUID memberId,
        String memberName,
        String email,
        NoteRole role,
        LocalDateTime joinedAt
) {
    public static NoteMemberResponse from(NoteMember noteMember) {
        return NoteMemberResponse.builder()
                .memberId(noteMember.getMember().getId())
                .memberName(noteMember.getMember().getName())
                .email(noteMember.getMember().getEmail())
                .role(noteMember.getRole())
                .joinedAt(noteMember.getCreatedAt())
                .build();
    }
}
