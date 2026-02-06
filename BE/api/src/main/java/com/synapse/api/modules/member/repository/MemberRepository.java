package com.synapse.api.modules.member.repository;

import com.synapse.api.modules.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

    @Query("SELECT u FROM Member u WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<Member> findByEmail(@Param("email") String email);

    @Query("SELECT u FROM Member u WHERE u.email = :email")
    Optional<Member> findByEmailIgnoreDeletedAt(@Param("email") String email);

    @Query("SELECT COUNT(u) > 0 FROM Member u WHERE u.email = :email AND u.deletedAt IS NULL")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT u.deletedAt IS NOT NULL FROM Member u WHERE u.email = :email")
    boolean isDeleted(@Param("email") String email);

    @Query("SELECT u FROM Member u WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<Member> findById(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Member m
        SET m.deletedAt = CURRENT_TIMESTAMP
        WHERE m.id = :memberId
          AND m.deletedAt IS NULL
    """)
    void softDeleteById(@Param("memberId") UUID memberId);

}
