package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.oauth.OAuthUserInfo;
import com.synapse.api.modules.member.dto.request.LoginRequest;
import com.synapse.api.modules.member.dto.request.UpdateThemeRequest;
import com.synapse.api.modules.member.dto.response.LoginResponse;
import com.synapse.api.modules.member.dto.response.LoginResult;
import com.synapse.api.modules.member.dto.response.ProfileResponse;
import com.synapse.api.modules.member.dto.response.StreakResponse;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.entity.OAuthAccount;
import com.synapse.api.modules.member.entity.Streak;
import com.synapse.api.modules.member.entity.StreakId;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.repository.OAuthRepository;
import com.synapse.api.modules.member.repository.StreakRepository;
import com.synapse.api.modules.mindmap.repository.MindmapEdgeRepository;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.redis.TokenRedisService;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final OAuthRepository oAuthRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final NoteRepository noteRepository;
    private final MindmapEdgeRepository mindmapEdgeRepository;
    private final StreakRepository streakRepository;

    private final TokenRedisService tokenRedisService;
    private final OAuthServiceFactory oAuthServiceFactory;
    private final JwtUtil jwtUtil;

    private static final int STREAK_PERIOD_DAYS = 180;

    @Transactional
    public LoginResult login(LoginRequest request) {

        OAuthUserInfo oAuthMemberInfo = getOAuthMemberInfo(request);

        Optional<Member> optionalMember = memberRepository.findByEmailIgnoreDeletedAt(oAuthMemberInfo.getEmail());

        Member member;
        if (optionalMember.isPresent()) {
            member = optionalMember.get();

            // 탈퇴(soft delete)된 계정인지 체크
            if (member.getDeletedAt() != null) {
                throw new BusinessException(ErrorCode.DELETED_MEMBER);
            }

            // 다른 provider로 가입했는지 체크
            Optional<OAuthAccount> optionalOAuth = oAuthRepository.findByProviderAndProviderId(
                    oAuthMemberInfo.getProvider(), oAuthMemberInfo.getProviderId());
            if (optionalOAuth.isEmpty()) {
                throw new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS_ANOTHER_PROVIDER);
            }
        } else {
            // 가입하지 않은 유저 -> 신규 회원가입
            member = saveNewMember(oAuthMemberInfo);
        }

        OAuthAccount oauth = oAuthRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        String access = jwtUtil.generateAccessToken(member.getId());
        String refresh = tokenRedisService.generateRefreshToken(member.getId());

        LoginResponse response = LoginResponse.builder()
                .accessToken(access)
                .isNewMember(optionalMember.isEmpty())
                .member(LoginResponse.Member.builder()
                        .id(member.getId())
                        .email(member.getEmail())
                        .name(member.getName())
                        .theme(member.getTheme())
                        .provider(oauth.getProvider())
                        .build())
                .build();

        return LoginResult.builder()
                .response(response)
                .refreshToken(refresh)
                .build();
    }

    private OAuthUserInfo getOAuthMemberInfo(LoginRequest request) {
        OAuthService oAuthService = oAuthServiceFactory.getService(request.provider());
        return oAuthService.getUserInfo(request.authorizationCode(), request.platform());
    }

    private Member saveNewMember(OAuthUserInfo oAuthMemberInfo) {
        Member member = memberRepository.save(Member.builder()
                .email(oAuthMemberInfo.getEmail())
                .name(oAuthMemberInfo.getName())
                .build());

        oAuthRepository.save(OAuthAccount.builder()
                .provider(oAuthMemberInfo.getProvider())
                .providerId(oAuthMemberInfo.getProviderId())
                .member(member)
                .build());

        return member;
    }

    public ProfileResponse getProfile(UUID memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        OAuthAccount oauth = oAuthRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        return ProfileResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .theme(member.getTheme())
                .provider(oauth.getProvider())
                .createdAt(member.getCreatedAt())
                .build();
    }

    public void logout(String accessToken, String refreshToken) {
        invalidTokens(accessToken, refreshToken);
    }

    public void invalidTokens(String accessToken, String refreshToken) {
        tokenRedisService.addAccessTokenToBlacklist(accessToken);
        tokenRedisService.deleteRefreshToken(refreshToken);
    }

    @Transactional
    public void withdraw(UUID memberId, String accessToken, String refreshToken) {

        // (선택) 존재 검증은 가볍게 exists로
        if (!memberRepository.existsById(memberId)) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        // streak
        streakRepository.softDeleteAllByMemberId(memberId);

        noteMemberRepository.softDeleteAllByMemberId(memberId);

        // OWNER note
        noteRepository.softDeleteOwnedNotesByMemberId(memberId);

        // OAuth / Member
        oAuthRepository.softDeleteByMemberId(memberId);
        memberRepository.softDeleteById(memberId);

        // mindmap 추후 구현 예정

        // 토큰 무효화
        invalidTokens(accessToken, refreshToken);
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
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .theme(member.getTheme())
                .provider(oauth.getProvider())
                .createdAt(member.getCreatedAt())
                .build();
    }

    public List<StreakResponse> getStreak(UUID memberId) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(STREAK_PERIOD_DAYS - 1);

        List<Streak> streaks = streakRepository
                .findStreaksByMemberAndDateRange(memberId, startDate, today);

        Set<LocalDate> streakDates = streaks.stream()
                .map(streak -> streak.getId().getStreakDate())
                .collect(java.util.stream.Collectors.toSet());

        List<StreakResponse> result = new java.util.ArrayList<>();
        for (int i = 0; i < STREAK_PERIOD_DAYS; i++) {
            LocalDate date = startDate.plusDays(i);
            result.add(StreakResponse.builder()
                    .date(date)
                    .isStreak(streakDates.contains(date))
                    .build());
        }

        return result;
    }

    @Transactional
    public void updateStreak(UUID memberId) {
        LocalDate today = LocalDate.now();
        StreakId streakId = new StreakId(
                memberId, today);

        if (!streakRepository.existsById(streakId)) {
            Member member = memberRepository.getReferenceById(memberId);
            Streak streak = Streak
                    .of(member, today);
            streakRepository.save(streak);
        }
    }

    @Transactional
    public ProfileResponse updateTheme(UUID memberId, UpdateThemeRequest request) {
        // 사용자 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // OAuth 정보 조회
        OAuthAccount oauth = oAuthRepository.findByMemberId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        member.updateLight(request.theme());

        // 업데이트된 프로필 반환
        return ProfileResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .theme(member.getTheme())
                .provider(oauth.getProvider())
                .createdAt(member.getCreatedAt())
                .build();
    }

}