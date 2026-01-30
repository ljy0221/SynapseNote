package com.synapse.api.modules.note.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InvitationStatus {
    PENDING("대기 중"),
    ACCEPTED("수락됨"),
    EXPIRED("만료됨"),
    REVOKED("철회됨");

    private final String description;
}
