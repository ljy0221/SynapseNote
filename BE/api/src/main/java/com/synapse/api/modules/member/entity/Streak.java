package com.synapse.api.modules.member.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

import com.synapse.api.util.entity.BaseEntity;

@Entity
@Table(name = "streaks")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Streak extends BaseEntity {

    @EmbeddedId
    private StreakId id;

    @MapsId("memberId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    private Streak(Member member, LocalDate date) {
        this.member = member;
        this.id = new StreakId(member.getId(), date);
    }

    public static Streak of(Member member, LocalDate date) {
        return new Streak(member, date);
    }
}
