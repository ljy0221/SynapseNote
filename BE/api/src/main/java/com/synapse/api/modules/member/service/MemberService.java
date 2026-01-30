package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.oauth.OAuthUserInfo;
import com.synapse.api.modules.member.dto.request.LoginRequest;
import com.synapse.api.modules.member.dto.response.LoginResponse;
import com.synapse.api.modules.member.dto.response.LoginResult;
import com.synapse.api.modules.member.dto.response.ProfileResponse;
import com.synapse.api.modules.member.entity.OAuthAccount;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.OAuthRepository;
import com.synapse.api.modules.member.repository.MemberRepository;
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
public class MemberService {

    private final MemberRepository memberRepository;
    private final OAuthRepository oAuthRepository;
    private final OAuthServiceFactory oAuthServiceFactory;
    private final TokenRedisService tokenRedisService;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResult login(LoginRequest request) {

        OAuthUserInfo oAuthMemberInfo = getOAuthMemberInfo(request);

        Optional<Member> optionalMember = memberRepository.findByEmail(oAuthMemberInfo.getEmail());

        Member member;
        if (optionalMember.isPresent()) {
            member = optionalMember.get();

            // 탈퇴(soft delete)된 계정인지 체크
            if (member.getDeletedAt() != null) {
                throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
            }

            // 다른 provider로 가입했는지 체크
            Optional<OAuthAccount> optionalOAuth = oAuthRepository.findByProviderAndProviderId(
                    oAuthMemberInfo.getProvider(), oAuthMemberInfo.getProviderId()
                    );
            if (optionalOAuth.isEmpty()) {
                throw new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS_ANOTHER_PROVIDER);
            }
        } else {
            // 가입하지 않은 유저 -> 신규 회원가입
            member = saveNewMember(oAuthMemberInfo);
        }

        boolean sessionReplaced = invalidSession(member.getId());

        String access = jwtUtil.generateAccessToken(member.getId());
        String refresh = tokenRedisService.generateRefreshToken(member.getId());
        OAuthAccount oauth = oAuthRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        LoginResponse response = LoginResponse.builder()
                .accessToken(access)
                .isNewMember(optionalMember.isEmpty())
                .member(LoginResponse.Member.builder()
                        .email(member.getEmail())
                        .name(member.getName())
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

    private OAuthUserInfo getOAuthMemberInfo(LoginRequest request) {
        OAuthService oAuthService = oAuthServiceFactory.getService(request.provider());
        return oAuthService.getUserInfo(request.authorizationCode());
    }

    private Member saveNewMember(OAuthUserInfo oAuthMemberInfo) {
        Member member = memberRepository.save(Member.builder()
                .email(oAuthMemberInfo.getEmail())
                .name(oAuthMemberInfo.getName())
                .build()
        );

        oAuthRepository.save(OAuthAccount.builder()
                .provider(oAuthMemberInfo.getProvider())
                .providerId(oAuthMemberInfo.getProviderId())
                .member(member)
                .build()
        );

        return member;
    }

    public ProfileResponse getProfile(UUID id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        OAuthAccount oauth = oAuthRepository.findByMemberId(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        return ProfileResponse.builder()
                .email(member.getEmail())
                .name(member.getName())
                .provider(oauth.getProvider())
                .createdAt(member.getCreatedAt())
                .build();
    }

    public void logout(UUID id, String accessToken) {
        invalidSession(id);
        tokenRedisService.addBlacklist(accessToken);
    }

    @Transactional
    public void withdraw(UUID id, String accessToken) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        OAuthAccount oauth = oAuthRepository.findByMemberId(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // streak
        // document members
        // notes
        // mindmap_edges

        member.delete();
        oauth.delete();
        invalidSession(id);
        tokenRedisService.addBlacklist(accessToken);
    }

    @Transactional
    public ProfileResponse updateNickname(UUID memberId, String newName) {
        String trimmedName = newName.trim();

        // 1. 사용자 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 2. 동일 닉네임 체크 (불필요한 업데이트 방지)
        if (!member.getName().equals(trimmedName)) {
            member.updateName(trimmedName);
        }

        // 3. OAuth 정보 조회 (ProfileResponse 생성용)
        OAuthAccount oauth = oAuthRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 4. 업데이트된 프로필 반환 (기존 member 객체 재사용)
        return ProfileResponse.builder()
                .email(member.getEmail())
                .name(member.getName())
                .provider(oauth.getProvider())
                .createdAt(member.getCreatedAt())
                .build();
    }

}