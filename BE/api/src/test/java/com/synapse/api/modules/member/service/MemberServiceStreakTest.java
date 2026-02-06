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
    @DisplayName("반기별 스트릭 조회 - 시작일부터 오늘까지의 스트릭 검증")
    void shouldReturnCorrectStreakHistory() {
        // given
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder().id(memberId).build();
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        Streak streak1 = Streak.of(member, today);
        Streak streak2 = Streak.of(member, yesterday);

        // 반기 시작일 계산 (Service 로직과 동일하게)
        int year = today.getYear();
        LocalDate startDate;
        if (today.getMonthValue() < 7) {
            startDate = LocalDate.of(year, 1, 1);
        } else {
            startDate = LocalDate.of(year, 7, 1);
        }

        given(streakRepository.findStreaksByMemberAndDateRange(eq(memberId), eq(startDate), eq(today)))
                .willReturn(List.of(streak1, streak2));

        // when
        List<StreakResponse> result = memberService.getStreak(memberId);

        // then
        long expectedDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, today) + 1;
        assertThat(result).hasSize((int) expectedDays);

        StreakResponse todayResponse = result.stream()
                .filter(r -> r.date().equals(today))
                .findFirst().orElseThrow();
        assertThat(todayResponse.isStreak()).isTrue();

        // 어제가 시작일보다 이전이면 리스트에 없을 수 있음 (1월 1일인 경우 등)
        if (!yesterday.isBefore(startDate)) {
            StreakResponse yesterdayResponse = result.stream()
                    .filter(r -> r.date().equals(yesterday))
                    .findFirst().orElseThrow();
            assertThat(yesterdayResponse.isStreak()).isTrue();
        }
    }
}
