package com.synapse.api.module.note.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode
public class NoteMemberId implements Serializable {

    @Column(name = "note_id", columnDefinition = "uuid")
    private UUID noteId;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;
}
