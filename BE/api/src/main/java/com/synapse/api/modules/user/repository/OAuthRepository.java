package com.synapse.api.modules.user.repository;

import com.synapse.api.modules.user.dto.oauth.OAuthProvider;
import com.synapse.api.modules.user.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Query("SELECT o FROM OAuthAccount o WHERE o.user.id = :userId AND o.deletedAt IS NULL")
    Optional<OAuthAccount> findByUserId(@Param("userId") UUID userId);

}
