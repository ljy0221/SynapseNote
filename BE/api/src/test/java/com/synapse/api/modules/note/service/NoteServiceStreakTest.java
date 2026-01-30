package com.synapse.api.modules.note.service;

import com.synapse.api.modules.block.service.BlockService;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.repository.StreakRepository;
import com.synapse.api.modules.member.entity.StreakId;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.response.NoteResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
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

    @Mock
    private BlockService blockService;

    @Test
    @DisplayName("노트 생성 시 오늘 스트릭이 없으면 새로 생성한다")
    void createNote_createsStreak_whenNoStreakExists() {
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
    void createNote_doesNotCreateStreak_whenStreakExists() {
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
}
