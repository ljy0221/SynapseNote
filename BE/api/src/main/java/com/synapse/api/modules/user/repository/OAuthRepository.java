package com.synapse.api.modules.user.repository;

import com.synapse.api.modules.user.dto.oauth.OAuthProvider;
import com.synapse.api.modules.user.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OAuthRepository extends JpaRepository<OAuthAccount, UUID> {
    Optional<OAuthAccount> findByProviderIdAndProvider(String providerId, OAuthProvider provider);
    Optional<OAuthAccount> findByUserId(UUID id);
}
