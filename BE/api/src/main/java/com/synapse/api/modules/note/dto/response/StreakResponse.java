package com.synapse.api.modules.note.dto.response;

import java.time.LocalDate;

public record StreakResponse(
        LocalDate date,
        boolean isStreak) {
    public static StreakResponse of(LocalDate date, boolean isStreak) {
        return new StreakResponse(date, isStreak);
    }
}
