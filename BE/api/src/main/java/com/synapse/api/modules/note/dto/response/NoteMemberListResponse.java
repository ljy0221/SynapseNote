package com.synapse.api.modules.note.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record NoteMemberListResponse(
        List<NoteMemberResponse> members
) {
    public static NoteMemberListResponse from(List<NoteMemberResponse> members) {
        return NoteMemberListResponse.builder()
                .members(members)
                .build();
    }
}
