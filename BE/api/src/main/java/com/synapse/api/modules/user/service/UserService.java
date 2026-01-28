package com.synapse.api.modules.user.service;

import com.synapse.api.modules.user.dto.oauth.OAuthUserInfo;
import com.synapse.api.modules.user.dto.request.LoginRequest;
import com.synapse.api.modules.user.dto.response.LoginResult;
import com.synapse.api.modules.user.dto.response.ProfileResponse;
import com.synapse.api.modules.user.entity.OAuthAccount;
import com.synapse.api.modules.user.entity.User;
import com.synapse.api.modules.user.repository.OAuthRepository;
import com.synapse.api.modules.user.repository.UserRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.redis.RedisConstant;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.redis.TokenRedisService;
import com.synapse.api.util.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OAuthRepository oAuthRepository;
    private final OAuthServiceFactory oAuthServiceFactory;
    private final TokenRedisService tokenRedisService;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResult login(LoginRequest request) {

        OAuthUserInfo oAuthUserInfo = getOAuthUserInfo(request);

        Optional<User> optionalUser = userRepository.findByEmail(oAuthUserInfo.getEmail());

        UUID id;
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();

            // 탈퇴(soft delete)된 계정인지 체크
            if (user.getDeletedAt() != null) {
                throw new BusinessException(ErrorCode.USER_NOT_FOUND);
            }

            // 다른 provider로 가입했는지 체크
            Optional<OAuthAccount> optionalOAuth = oAuthRepository.findByProviderIdAndProvider(
                    oAuthUserInfo.getProviderId(), oAuthUserInfo.getProvider()
            );
            if (optionalOAuth.isEmpty()) {
                throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS_ANOTHER_PROVIDER);
            }

            id = user.getId();
        } else {
            // 가입하지 않은 유저 -> 신규 회원가입
            id = saveNewUser(oAuthUserInfo);
        }

        boolean sessionReplaced = invalidSession(id);

        String access = jwtUtil.generateAccessToken(id);
        String refresh = tokenRedisService.generateRefreshToken(id);
        return LoginResult.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .sessionReplaced(sessionReplaced)
                .build();
    }

    private boolean invalidSession(UUID id) {
        if (tokenRedisService.getRefreshToken(id) == null) {
            return false;
        }

        tokenRedisService.deleteRefreshToken(id);
        return true;
    }

    private OAuthUserInfo getOAuthUserInfo(LoginRequest request) {
        OAuthService oAuthService = oAuthServiceFactory.getService(request.provider());
        return oAuthService.getUserInfo(request.authorizationCode());
    }

    private UUID saveNewUser(OAuthUserInfo oAuthUserInfo) {
        User user = userRepository.save(User.builder()
                .email(oAuthUserInfo.getEmail())
                .name(oAuthUserInfo.getName())
                .build()
        );

        oAuthRepository.save(OAuthAccount.builder()
                .provider(oAuthUserInfo.getProvider())
                .providerId(oAuthUserInfo.getProviderId())
                .user(user)
                .build()
        );

        return user.getId();
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        OAuthAccount oauth = oAuthRepository.findByUserId(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return ProfileResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .provider(oauth.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public void logout(UUID id, String accessToken) {
        invalidSession(id);
        tokenRedisService.addBlacklist(accessToken);
    }

    @Transactional
    public void withdraw(UUID id, String accessToken) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        OAuthAccount oauth = oAuthRepository.findByUserId(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // streak
        // document members
        // notes
        // mindmap_edges

        user.delete();
        oauth.delete();
        invalidSession(id);
        tokenRedisService.addBlacklist(accessToken);
    }

}