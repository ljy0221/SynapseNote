package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.member.entity.Streak;
import com.synapse.api.modules.member.entity.StreakId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StreakRepository extends JpaRepository<Streak, StreakId> {
    @Query("SELECT s FROM Streak s WHERE s.id.memberId = :memberId AND s.id.streakDate BETWEEN :startDate AND :endDate")
    List<Streak> findStreaksByMemberAndDateRange(@Param("memberId") UUID memberId,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
