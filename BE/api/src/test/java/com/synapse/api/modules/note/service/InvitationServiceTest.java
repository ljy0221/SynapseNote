package com.synapse.api.modules.note.service;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.note.dto.response.InvitationListResponse;
import com.synapse.api.modules.note.entity.Invitation;
import com.synapse.api.modules.note.entity.InvitationStatus;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.InvitationRepository;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @InjectMocks
    private InvitationService invitationService;

    @Mock
    private InvitationRepository invitationRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private NoteMemberRepository noteMemberRepository;

    @Mock
    private MemberRepository memberRepository;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(invitationService, "frontendBaseUrl", "http://localhost:3000");
    }

    @Test
    @DisplayName("OWNER가 PENDING 초대 목록을 조회한다")
    void getPendingInvitations_asOwner_success() {
        // given
        UUID ownerId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member owner = Member.builder().id(ownerId).build();
        Note note = Note.builder()
                .id(noteId)
                .title("Test Note")
                .createdBy(owner)
                .build();

        UUID invitationToken = UUID.randomUUID();
        Invitation invitation = Invitation.builder()
                .id(UUID.randomUUID())
                .invitationToken(invitationToken)
                .note(note)
                .invitedBy(owner)
                .invitedEmail("test@example.com")
                .role(NoteRole.EDITOR)
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));
        given(invitationRepository.findByNoteIdAndStatus(noteId, InvitationStatus.PENDING))
                .willReturn(List.of(invitation));

        // when
        InvitationListResponse response = invitationService.getPendingInvitations(noteId, ownerId);

        // then
        assertThat(response.invitations()).hasSize(1);
        assertThat(response.invitations().get(0).invitedEmail()).isEqualTo("test@example.com");
        assertThat(response.invitations().get(0).status()).isEqualTo(InvitationStatus.PENDING);
        assertThat(response.invitations().get(0).role()).isEqualTo(NoteRole.EDITOR);
    }

    @Test
    @DisplayName("OWNER가 아닌 사용자는 초대 목록 조회에 실패한다")
    void getPendingInvitations_notOwner_throwsException() {
        // given
        UUID ownerId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member owner = Member.builder().id(ownerId).build();
        Note note = Note.builder()
                .id(noteId)
                .createdBy(owner)
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

        // when & then
        BusinessException exception = assertThrows(BusinessException.class, () ->
                invitationService.getPendingInvitations(noteId, requesterId));

        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INVITATION_ONLY_OWNER);
    }

    @Test
    @DisplayName("존재하지 않는 노트의 초대 목록 조회에 실패한다")
    void getPendingInvitations_noteNotFound_throwsException() {
        // given
        UUID noteId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        given(noteRepository.findById(noteId)).willReturn(Optional.empty());

        // when & then
        BusinessException exception = assertThrows(BusinessException.class, () ->
                invitationService.getPendingInvitations(noteId, memberId));

        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.NOTE_NOT_FOUND);
    }

    @Test
    @DisplayName("PENDING 초대가 없으면 빈 목록을 반환한다")
    void getPendingInvitations_noInvitations_returnsEmptyList() {
        // given
        UUID ownerId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member owner = Member.builder().id(ownerId).build();
        Note note = Note.builder()
                .id(noteId)
                .createdBy(owner)
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));
        given(invitationRepository.findByNoteIdAndStatus(noteId, InvitationStatus.PENDING))
                .willReturn(List.of());

        // when
        InvitationListResponse response = invitationService.getPendingInvitations(noteId, ownerId);

        // then
        assertThat(response.invitations()).isEmpty();
    }
}
