package com.synapse.api.modules.member.repository;

import com.synapse.api.modules.member.entity.Streak;
import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.api.modules.member.entity.StreakId;

public interface StreakRepository extends JpaRepository<Streak, StreakId> {
}
