package com.synapse.api.modules.note.service;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.entity.StreakId;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.response.StreakResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.note.repository.StreakRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NoteServiceStreakTest {

        @InjectMocks
        private NoteService noteService;

        @Mock
        private NoteRepository noteRepository;

        @Mock
        private NoteMemberRepository noteMemberRepository;

        @Mock
        private MemberRepository memberRepository;

        @Mock
        private StreakRepository streakRepository;

        @Test
        @DisplayName("노트 생성 시 오늘 스트릭이 없으면 새로 생성한다")
        void createsStreak_whenNoStreakExists() {
                // given
                UUID memberId = UUID.randomUUID();
                Member member = Member.builder().id(memberId).build();
                NoteCreateRequest request = new NoteCreateRequest("Title", "/", 0.0, 0.0, "");
                Note note = Note.builder().id(UUID.randomUUID()).createdBy(member).build();

                given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
                given(noteRepository.save(any(Note.class))).willReturn(note);
                given(streakRepository.existsById(any(StreakId.class)))
                                .willReturn(false);

                // when
                noteService.createNote(memberId, request);

                // then
                verify(streakRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("노트 생성 시 오늘 스트릭이 이미 있으면 생성하지 않는다")
        void createNote__whenStreakExists() {
                // given
                UUID memberId = UUID.randomUUID();
                Member member = Member.builder().id(memberId).build();
                NoteCreateRequest request = new NoteCreateRequest("Title", "/", 0.0, 0.0, "");
                Note note = Note.builder().id(UUID.randomUUID()).createdBy(member).build();

                given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
                given(noteRepository.save(any(Note.class))).willReturn(note);
                given(streakRepository.existsById(any(StreakId.class)))
                                .willReturn(true);

                // when
                noteService.createNote(memberId, request);

                // then
                verify(streakRepository, never()).save(any());
        }

        @Test
        @DisplayName("180일 스트릭 조회 - 스트릭이 있는 날짜는 true 반환")
        void getStreak() {
                // given
                UUID memberId = UUID.randomUUID();
                Member member = Member.builder().id(memberId).build();
                java.time.LocalDate today = java.time.LocalDate.now();
                java.time.LocalDate yesterday = today.minusDays(1);

                com.synapse.api.modules.member.entity.Streak streak1 = com.synapse.api.modules.member.entity.Streak.of(
                                member,
                                today);
                com.synapse.api.modules.member.entity.Streak streak2 = com.synapse.api.modules.member.entity.Streak.of(
                                member,
                                yesterday);

                given(streakRepository.findStreaksByMemberAndDateRange(eq(memberId), any(), any()))
                                .willReturn(java.util.List.of(streak1, streak2));

                // when
                java.util.List<StreakResponse> result = noteService
                                .getStreak(memberId);

                // then
                assertThat(result).hasSize(180);
                assertThat(result.get(179).isStreak()).isTrue();
                assertThat(result.get(178).isStreak()).isTrue();
                assertThat(result.get(177).isStreak()).isFalse();
        }
}
