package com.synapse.api.modules.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode
public class StreakId implements Serializable {

    @Column(name = "member_id", columnDefinition = "uuid", nullable = false)
    private UUID memberId;

    @Column(name = "streak_date", nullable = false)
    private LocalDate streakDate;
}
