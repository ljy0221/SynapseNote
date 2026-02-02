package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.response.StreakResponse;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.entity.Streak;
import com.synapse.api.modules.member.entity.StreakId;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.repository.StreakRepository;
import com.synapse.api.modules.member.repository.OAuthRepository;
import com.synapse.api.util.redis.TokenRedisService;
import com.synapse.api.util.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceStreakTest {

    @InjectMocks
    private MemberService memberService;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private StreakRepository streakRepository;

    @Mock
    private OAuthRepository oAuthRepository;
    @Mock
    private OAuthServiceFactory oAuthServiceFactory;
    @Mock
    private TokenRedisService tokenRedisService;
    @Mock
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("스트릭 업데이트 - 오늘 스트릭이 없으면 생성")
    void shouldCreateStreakWhenNoneExists() {
        // given
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder().id(memberId).build();

        given(streakRepository.existsById(any(StreakId.class))).willReturn(false);
        given(memberRepository.getReferenceById(memberId)).willReturn(member);

        // when
        memberService.updateStreak(memberId);

        // then
        verify(streakRepository, times(1)).save(any(Streak.class));
    }

    @Test
    @DisplayName("스트릭 업데이트 - 오늘 스트릭이 이미 있으면 생성하지 않음")
    void shouldNotCreateStreakWhenExists() {
        // given
        UUID memberId = UUID.randomUUID();

        given(streakRepository.existsById(any(StreakId.class))).willReturn(true);

        // when
        memberService.updateStreak(memberId);

        // then
        verify(streakRepository, never()).save(any(Streak.class));
    }

    @Test
    @DisplayName("180일 스트릭 조회 - 스트릭이 있는 날짜 검증")
    void shouldReturnCorrectStreakHistory() {
        // given
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder().id(memberId).build();
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        Streak streak1 = Streak.of(member, today);
        Streak streak2 = Streak.of(member, yesterday);

        given(streakRepository.findStreaksByMemberAndDateRange(eq(memberId), any(), any()))
                .willReturn(List.of(streak1, streak2));

        // when
        List<StreakResponse> result = memberService.getStreak(memberId);

        // then
        assertThat(result).hasSize(180);

        StreakResponse todayResponse = result.stream()
                .filter(r -> r.date().equals(today))
                .findFirst().orElseThrow();
        assertThat(todayResponse.isStreak()).isTrue();

        StreakResponse yesterdayResponse = result.stream()
                .filter(r -> r.date().equals(yesterday))
                .findFirst().orElseThrow();
        assertThat(yesterdayResponse.isStreak()).isTrue();

        StreakResponse twoDaysAgoResponse = result.stream()
                .filter(r -> r.date().equals(today.minusDays(2)))
                .findFirst().orElseThrow();
        assertThat(twoDaysAgoResponse.isStreak()).isFalse();
    }
}
