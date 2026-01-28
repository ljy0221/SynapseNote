package com.synapse.api.modules.user.service;

import com.synapse.api.modules.user.dto.oauth.OAuthUserInfo;
import com.synapse.api.modules.user.dto.request.LoginRequest;
import com.synapse.api.modules.user.dto.response.LoginResponse;
import com.synapse.api.modules.user.dto.response.LoginResult;
import com.synapse.api.modules.user.dto.response.ProfileResponse;
import com.synapse.api.modules.user.entity.OAuthAccount;
import com.synapse.api.modules.user.entity.User;
import com.synapse.api.modules.user.repository.OAuthRepository;
import com.synapse.api.modules.user.repository.UserRepository;
import com.synapse.api.util.exception.BusinessException;
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
@Transactional(readOnly = true)
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

        User user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();

            // 탈퇴(soft delete)된 계정인지 체크
            if (user.getDeletedAt() != null) {
                throw new BusinessException(ErrorCode.USER_NOT_FOUND);
            }

            // 다른 provider로 가입했는지 체크
            Optional<OAuthAccount> optionalOAuth = oAuthRepository.findByProviderAndProviderId(
                    oAuthUserInfo.getProvider(), oAuthUserInfo.getProviderId()
                    );
            if (optionalOAuth.isEmpty()) {
                throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS_ANOTHER_PROVIDER);
            }
        } else {
            // 가입하지 않은 유저 -> 신규 회원가입
            user = saveNewUser(oAuthUserInfo);
        }

        boolean sessionReplaced = invalidSession(user.getId());

        String access = jwtUtil.generateAccessToken(user.getId());
        String refresh = tokenRedisService.generateRefreshToken(user.getId());
        OAuthAccount oauth = oAuthRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        LoginResponse response = LoginResponse.builder()
                .accessToken(access)
                .isNewUser(optionalUser.isEmpty())
                .user(LoginResponse.User.builder()
                        .email(user.getEmail())
                        .name(user.getName())
                        .provider(oauth.getProvider())
                        .build()
                )
                .sessionReplaced(sessionReplaced)
                .build();

        return LoginResult.builder()
                .response(response)
                .refreshToken(refresh)
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

    private User saveNewUser(OAuthUserInfo oAuthUserInfo) {
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

        return user;
    }

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