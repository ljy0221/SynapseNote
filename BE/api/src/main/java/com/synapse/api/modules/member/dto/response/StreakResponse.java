package com.synapse.api.modules.member.dto.response;

import java.time.LocalDate;

import lombok.Builder;

@Builder
public record StreakResponse(LocalDate date, boolean isStreak) {
    public static StreakResponse of(LocalDate date, boolean isStreak) {
        return StreakResponse.builder()
                .date(date)
                .isStreak(isStreak)
                .build();
    }
}
