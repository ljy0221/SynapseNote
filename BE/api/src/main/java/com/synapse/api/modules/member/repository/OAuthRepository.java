package com.synapse.api.modules.member.repository;

import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import com.synapse.api.modules.member.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OAuthRepository extends JpaRepository<OAuthAccount, UUID> {

    @Query("SELECT o FROM OAuthAccount o WHERE o.provider = :provider AND o.providerId = :providerId AND o.deletedAt IS NULL")
    Optional<OAuthAccount> findByProviderAndProviderId(
            @Param("provider") OAuthProvider provider,
            @Param("providerId") String providerId
    );

    @Query("SELECT o FROM OAuthAccount o WHERE o.member.id = :memberId AND o.deletedAt IS NULL")
    Optional<OAuthAccount> findByMemberId(@Param("memberId") UUID memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE OAuthAccount o
        SET o.deletedAt = CURRENT_TIMESTAMP
        WHERE o.member.id = :memberId
          AND o.deletedAt IS NULL
    """)
    void softDeleteByMemberId(@Param("memberId") UUID memberId);

}
