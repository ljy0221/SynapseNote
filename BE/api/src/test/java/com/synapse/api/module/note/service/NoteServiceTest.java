package com.synapse.api.module.note.service;

import com.synapse.api.module.note.document.NoteContent;
import com.synapse.api.module.note.dto.*;
import com.synapse.api.module.note.entity.Note;
import com.synapse.api.module.note.entity.NoteMember;
import com.synapse.api.module.note.entity.NoteRole;
import com.synapse.api.module.note.repository.NoteContentRepository;
import com.synapse.api.module.note.repository.NoteMemberRepository;
import com.synapse.api.module.note.repository.NoteRepository;
import com.synapse.api.module.user.entity.User;
import com.synapse.api.module.user.repository.UserRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("NoteService 단위 테스트")
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private NoteMemberRepository noteMemberRepository;

    @Mock
    private NoteContentRepository noteContentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NoteService noteService;

    private User testUser;
    private Note testNote;
    private NoteContent testNoteContent;
    private UUID userId;
    private UUID noteId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        noteId = UUID.randomUUID();

        testUser = User.builder()
                .email("test@example.com")
                .name("Test User")
                .build();
        ReflectionTestUtils.setField(testUser, "id", userId);

        testNote = Note.builder()
                .title("Test Note")
                .directoryPath("/test")
                .pointX(100.0)
                .pointY(200.0)
                .createdBy(testUser)
                .build();
        ReflectionTestUtils.setField(testNote, "id", noteId);

        testNoteContent = NoteContent.create(noteId.toString(), "Test Content");
    }

    @Test
    @DisplayName("노트 생성 성공")
    void createNote_Success() {
        // given
        NoteCreateRequest request = NoteCreateRequest.builder()
                .title("New Note")
                .directoryPath("/new")
                .pointX(50.0)
                .pointY(100.0)
                .content("New Content")
                .build();

        given(userRepository.findById(userId)).willReturn(Optional.of(testUser));
        given(noteRepository.save(any(Note.class))).willReturn(testNote);
        given(noteMemberRepository.save(any(NoteMember.class))).willReturn(null);
        given(noteContentRepository.save(any(NoteContent.class))).willReturn(testNoteContent);

        // when
        NoteResponse response = noteService.createNote(userId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo(testNote.getTitle());
        verify(userRepository).findById(userId);
        verify(noteRepository).save(any(Note.class));
        verify(noteMemberRepository).save(any(NoteMember.class));
        verify(noteContentRepository).save(any(NoteContent.class));
    }

    @Test
    @DisplayName("노트 생성 실패 - 사용자 없음")
    void createNote_UserNotFound() {
        // given
        NoteCreateRequest request = NoteCreateRequest.builder()
                .title("New Note")
                .build();

        given(userRepository.findById(userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.createNote(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.USER_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("노트 조회 성공 - 작성자")
    void getNoteById_Success_AsOwner() {
        // given
        given(noteRepository.findById(noteId)).willReturn(Optional.of(testNote));
        given(noteContentRepository.findByNoteId(noteId.toString())).willReturn(Optional.of(testNoteContent));

        // when
        NoteDetailResponse response = noteService.getNoteById(noteId, userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo(testNote.getTitle());
        assertThat(response.getContent()).isEqualTo(testNoteContent.getContent());
    }

    @Test
    @DisplayName("노트 조회 실패 - 노트 없음")
    void getNoteById_NoteNotFound() {
        // given
        given(noteRepository.findById(noteId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.getNoteById(noteId, userId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.NOTE_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("노트 조회 실패 - 접근 권한 없음")
    void getNoteById_AccessDenied() {
        // given
        UUID otherUserId = UUID.randomUUID();
        User otherUser = User.builder()
                .email("other@example.com")
                .name("Other User")
                .build();
        ReflectionTestUtils.setField(otherUser, "id", otherUserId);

        Note otherNote = Note.builder()
                .title("Other Note")
                .createdBy(otherUser)
                .build();
        ReflectionTestUtils.setField(otherNote, "id", noteId);

        given(noteRepository.findById(noteId)).willReturn(Optional.of(otherNote));
        given(noteMemberRepository.existsByNoteIdAndUserId(noteId, userId)).willReturn(false);

        // when & then
        assertThatThrownBy(() -> noteService.getNoteById(noteId, userId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.NOTE_ACCESS_DENIED.getMessage());
    }

    @Test
    @DisplayName("전체 노트 조회 성공")
    void getAllNotes_Success() {
        // given
        given(noteRepository.findByCreatedById(userId)).willReturn(List.of(testNote));
        given(noteMemberRepository.findByUserId(userId)).willReturn(List.of());

        // when
        List<NoteResponse> response = noteService.getAllNotes(userId);

        // then
        assertThat(response).isNotEmpty();
        assertThat(response).hasSize(1);
        assertThat(response.get(0).getTitle()).isEqualTo(testNote.getTitle());
    }

    @Test
    @DisplayName("노트 수정 성공 - OWNER")
    void updateNote_Success_AsOwner() {
        // given
        NoteUpdateRequest request = NoteUpdateRequest.builder()
                .title("Updated Title")
                .directoryPath("/updated")
                .content("Updated Content")
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(testNote));
        given(noteContentRepository.findByNoteId(noteId.toString())).willReturn(Optional.of(testNoteContent));
        given(noteContentRepository.save(any(NoteContent.class))).willReturn(testNoteContent);

        // when
        NoteResponse response = noteService.updateNote(noteId, userId, request);

        // then
        assertThat(response).isNotNull();
        verify(noteContentRepository).save(any(NoteContent.class));
    }

    @Test
    @DisplayName("노트 수정 성공 - EDITOR")
    void updateNote_Success_AsEditor() {
        // given
        UUID editorId = UUID.randomUUID();
        User editor = User.builder()
                .email("editor@example.com")
                .name("Editor")
                .build();

        NoteUpdateRequest request = NoteUpdateRequest.builder()
                .title("Updated by Editor")
                .directoryPath("/editor")
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(testNote));
        given(noteMemberRepository.findRoleByNoteIdAndUserId(noteId, editorId))
                .willReturn(Optional.of(NoteRole.EDITOR));

        // when
        NoteResponse response = noteService.updateNote(noteId, editorId, request);

        // then
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("노트 수정 실패 - VIEWER")
    void updateNote_Fail_AsViewer() {
        // given
        UUID viewerId = UUID.randomUUID();
        NoteUpdateRequest request = NoteUpdateRequest.builder()
                .title("Updated Title")
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(testNote));
        given(noteMemberRepository.findRoleByNoteIdAndUserId(noteId, viewerId))
                .willReturn(Optional.of(NoteRole.VIEWER));

        // when & then
        assertThatThrownBy(() -> noteService.updateNote(noteId, viewerId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.NOTE_EDIT_PERMISSION_DENIED.getMessage());
    }

    @Test
    @DisplayName("노트 위치 업데이트 성공")
    void updatePosition_Success() {
        // given
        NotePositionUpdateRequest request = NotePositionUpdateRequest.builder()
                .pointX(300.0)
                .pointY(400.0)
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(testNote));

        // when
        noteService.updatePosition(noteId, userId, request);

        // then
        verify(noteRepository, atLeastOnce()).findById(noteId);
    }

    @Test
    @DisplayName("노트 삭제 성공 - OWNER (Soft Delete)")
    void deleteNote_Success_AsOwner() {
        // given
        given(noteRepository.findById(noteId)).willReturn(Optional.of(testNote));
        given(noteContentRepository.findByNoteId(noteId.toString())).willReturn(Optional.of(testNoteContent));
        given(noteContentRepository.save(any(NoteContent.class))).willReturn(testNoteContent);

        // when
        noteService.deleteNote(noteId, userId);

        // then
        assertThat(testNote.isDeleted()).isTrue();
        assertThat(testNote.getDeletedAt()).isNotNull();
        assertThat(testNoteContent.isDeleted()).isTrue();
        verify(noteContentRepository).save(testNoteContent);
    }

    @Test
    @DisplayName("노트 삭제 실패 - OWNER 아님")
    void deleteNote_Fail_NotOwner() {
        // given
        UUID otherUserId = UUID.randomUUID();
        User otherUser = User.builder()
                .email("other@example.com")
                .name("Other User")
                .build();
        ReflectionTestUtils.setField(otherUser, "id", otherUserId);

        Note otherNote = Note.builder()
                .title("Other Note")
                .createdBy(otherUser)
                .build();
        ReflectionTestUtils.setField(otherNote, "id", noteId);

        given(noteRepository.findById(noteId)).willReturn(Optional.of(otherNote));

        // when & then
        assertThatThrownBy(() -> noteService.deleteNote(noteId, userId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(ErrorCode.NOTE_DELETE_PERMISSION_DENIED.getMessage());
    }

    @Test
    @DisplayName("노트 검색 성공")
    void searchNotes_Success() {
        // given
        String query = "test";
        given(noteRepository.searchByUserAndQuery(userId, query)).willReturn(List.of(testNote));

        // when
        List<NoteResponse> response = noteService.searchNotes(userId, query);

        // then
        assertThat(response).isNotEmpty();
        assertThat(response).hasSize(1);
        verify(noteRepository).searchByUserAndQuery(userId, query);
    }
}
