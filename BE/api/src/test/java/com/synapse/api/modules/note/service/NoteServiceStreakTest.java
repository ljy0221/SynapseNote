package com.synapse.api.modules.note.service;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.service.MemberService;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
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
        private MemberService memberService;

        @Test
        @DisplayName("노트 생성 시 스트릭 업데이트를 MemberService에 위임한다")
        void shouldDelegateStreakUpdateToMemberService() {
                // given
                UUID memberId = UUID.randomUUID();
                Member member = Member.builder().id(memberId).build();
                NoteCreateRequest request = new NoteCreateRequest("Title", "/", 0.0, 0.0, "");
                Note note = Note.builder().id(UUID.randomUUID()).createdBy(member).build();

                given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
                given(noteRepository.save(any(Note.class))).willReturn(note);

                // when
                noteService.createNote(memberId, request);

                // then
                verify(memberService, times(1)).updateStreak(memberId);
        }
}
