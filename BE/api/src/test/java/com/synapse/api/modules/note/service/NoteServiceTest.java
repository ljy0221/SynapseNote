package com.synapse.api.modules.note.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.dto.response.BlockPageResponse;
import com.synapse.api.modules.block.service.BlockService;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.service.MemberService;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.response.NotePageResponse;
import com.synapse.api.modules.note.dto.response.NoteResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @InjectMocks
    private NoteService noteService;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private NoteMemberRepository noteMemberRepository;

    @Mock
    private BlockService blockService;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private MemberService memberService;

    @Spy
    private NoteValidator noteValidator = new NoteValidator(noteRepository, noteMemberRepository);

    @Test
    @DisplayName("노트 즐겨찾기를 설정한다")
    void bookmarkNote() {
        // given
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member member = Member.builder().id(userId).build();
        Note note = Note.builder()
                .id(noteId)
                .createdBy(member)
                .bookmark(false)
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

        // when
        noteService.bookmarkNote(userId, noteId);

        // then
        assertThat(note.isBookmark()).isTrue();
    }

    @Test
    @DisplayName("노트 즐겨찾기를 해제한다")
    void unbookmarkNote() {
        // given
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member member = Member.builder().id(userId).build();
        Note note = Note.builder()
                .id(noteId)
                .createdBy(member)
                .bookmark(true)
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

        // when
        noteService.unbookmarkNote(userId, noteId);

        // then
        assertThat(note.isBookmark()).isFalse();
    }

    @Test
    @DisplayName("즐겨찾기된 노트 목록을 페이징하여 조회한다")
    void getNoteBookmarks() {
        // given
        UUID userId = UUID.randomUUID();
        int page = 0;
        int size = 10;
        Member member = Member.builder().id(userId).name("Test User").build();

        Note note1 = Note.builder()
                .id(UUID.randomUUID())
                .title("Note 1")
                .createdBy(member)
                .bookmark(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Note note2 = Note.builder()
                .id(UUID.randomUUID())
                .title("Note 2")
                .createdBy(member)
                .bookmark(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<Note> notes = List.of(note1, note2);
        Page<Note> notePage = new PageImpl<>(notes, PageRequest.of(page, size), notes.size());

        given(noteRepository.findBookmarkedNotesByMemberId(eq(userId), any(Pageable.class)))
                .willReturn(notePage);

        // when
        NotePageResponse response = noteService.getNoteBookmarks(userId, page, size);

        // then
        assertThat(response.content()).hasSize(2);
        assertThat(response.currentPage()).isEqualTo(1); // 1-based
        assertThat(response.totalElements()).isEqualTo(2);
        assertThat(response.content().get(0).bookmark()).isTrue();

        verify(noteRepository).findBookmarkedNotesByMemberId(eq(userId), any(Pageable.class));
    }

    // =========================================================================
    // 블록 북마크 테스트
    // =========================================================================

    @Test
    @DisplayName("블록 즐겨찾기를 설정한다")
    void bookmarkBlock() {
        // given
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        UUID blockId = UUID.randomUUID();
        Member member = Member.builder().id(userId).build();
        Note note = Note.builder()
                .id(noteId)
                .createdBy(member)
                .directoryPath("/test/path")
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

        // when
        noteService.bookmarkBlock(userId, noteId, blockId);

        // then
        verify(blockService).bookmarkBlock(blockId, noteId, userId);
    }

    @Test
    @DisplayName("블록 즐겨찾기를 해제한다")
    void unbookmarkBlock() {
        // given
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        UUID blockId = UUID.randomUUID();
        Member member = Member.builder().id(userId).build();
        Note note = Note.builder()
                .id(noteId)
                .createdBy(member)
                .directoryPath("/test/path")
                .build();

        given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

        // when
        noteService.unbookmarkBlock(userId, noteId, blockId);

        // then
        verify(blockService).unbookmarkBlock(blockId, noteId, userId);
    }

    @Test
    @DisplayName("즐겨찾기된 블록 목록을 페이징하여 조회한다")
    void getBlockBookmarks() {
        // given
        UUID userId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        int page = 0;
        int size = 10;

        CodeBlock codeBlock = CodeBlock.builder()
                .blockId(UUID.randomUUID())
                .noteId(noteId)
                .ownerId(userId)
                .order(1.0)
                .properties(CodeBlock.CodeProperties.builder()
                        .language("python")
                        .code("print('test')")
                        .build())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        List<BaseBlock> blocks = List.of(codeBlock);
        Page<BaseBlock> blockPage = new PageImpl<>(blocks, PageRequest.of(page, size), blocks.size());
        BlockPageResponse expectedResponse = BlockPageResponse.from(blockPage,
                Map.of(noteId, "/projects/backend"), java.util.Collections.emptySet());

        given(blockService.getAllBookmarkedBlocks(userId, page, size)).willReturn(expectedResponse);

        // when
        BlockPageResponse response = blockService.getAllBookmarkedBlocks(userId, page, size);

        // then
        assertThat(response.content()).hasSize(1);
        assertThat(response.currentPage()).isEqualTo(1); // 1-based
        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.content().get(0).noteId()).isEqualTo(noteId);
        assertThat(response.content().get(0).notePath()).isEqualTo("/projects/backend");

        verify(blockService).getAllBookmarkedBlocks(userId, page, size);
    }

    // =========================================================================
    // 노트 생성 테스트
    // =========================================================================

    @Test
    @DisplayName("클라이언트 전송 ID로 노트를 정상 생성한다")
    void createNote() {
        // given
        UUID memberId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member member = Member.builder().id(memberId).build();
        NoteCreateRequest request = new NoteCreateRequest(noteId, "Test Note", "/work", 1.0, 2.0, "");
        Note savedNote = Note.builder()
                .id(noteId)
                .title("Test Note")
                .createdBy(member)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
        given(noteRepository.existsById(noteId)).willReturn(false);
        given(noteRepository.save(any(Note.class))).willReturn(savedNote);

        // when
        NoteResponse response = noteService.createNote(memberId, request);

        // then
        assertThat(response.noteId()).isEqualTo(noteId);
        verify(noteRepository).existsById(noteId);
        verify(noteRepository).save(any(Note.class));
        verify(noteMemberRepository).save(any(NoteMember.class));
        verify(memberService).updateStreak(memberId);
    }

    @Test
    @DisplayName("중복 ID가 전송되면 NOTE_ID_DUPLICATE 에러를 발생시킨다")
    void createNote_duplicateId() {
        // given
        UUID memberId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Member member = Member.builder().id(memberId).build();
        NoteCreateRequest request = new NoteCreateRequest(noteId, "Test Note", "/work", 1.0, 2.0, "");

        given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
        given(noteRepository.existsById(noteId)).willReturn(true);

        // when & then
        assertThrows(BusinessException.class, () -> noteService.createNote(memberId, request));
        verify(noteRepository).existsById(noteId);
        verify(noteRepository, never()).save(any(Note.class));
    }
}
