package com.synapse.api.modules.note.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.dto.response.BlockPageResponse;
import com.synapse.api.modules.block.service.BlockService;
import com.synapse.api.modules.note.dto.response.NotePageResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.user.entity.User;
import com.synapse.api.util.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
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

        @Test
        @DisplayName("노트 즐겨찾기를 설정한다")
        void bookmarkNote() {
                // given
                UUID userId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();
                User user = User.builder().id(userId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(user)
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
                User user = User.builder().id(userId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(user)
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
                User user = User.builder().id(userId).name("Test User").build();

                Note note1 = Note.builder()
                                .id(UUID.randomUUID())
                                .title("Note 1")
                                .createdBy(user)
                                .bookmark(true)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                Note note2 = Note.builder()
                                .id(UUID.randomUUID())
                                .title("Note 2")
                                .createdBy(user)
                                .bookmark(true)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                List<Note> notes = List.of(note1, note2);
                Page<Note> notePage = new PageImpl<>(notes, PageRequest.of(page, size), notes.size());

                given(noteRepository.findBookmarkedNotesByUserId(eq(userId), any(Pageable.class)))
                                .willReturn(notePage);

                // when
                NotePageResponse response = noteService.getNoteBookmarks(userId, page, size);

                // then
                assertThat(response.content()).hasSize(2);
                assertThat(response.currentPage()).isEqualTo(1); // 1-based
                assertThat(response.totalElements()).isEqualTo(2);
                assertThat(response.content().get(0).bookmark()).isTrue();

                verify(noteRepository).findBookmarkedNotesByUserId(eq(userId), any(Pageable.class));
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
                String blockId = "block-uuid-001";
                User user = User.builder().id(userId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(user)
                                .directoryPath("/test/path")
                                .build();

                given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

                // when
                noteService.bookmarkBlock(userId, noteId, blockId);

                // then
                verify(blockService).bookmarkBlock(blockId, noteId.toString());
        }

        @Test
        @DisplayName("블록 즐겨찾기를 해제한다")
        void unbookmarkBlock() {
                // given
                UUID userId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();
                String blockId = "block-uuid-001";
                User user = User.builder().id(userId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(user)
                                .directoryPath("/test/path")
                                .build();

                given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

                // when
                noteService.unbookmarkBlock(userId, noteId, blockId);

                // then
                verify(blockService).unbookmarkBlock(blockId, noteId.toString());
        }

        @Test
        @DisplayName("즐겨찾기된 블록 목록을 페이징하여 조회한다")
        void getBlockBookmarks() {
                // given
                UUID userId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();
                int page = 0;
                int size = 10;
                User user = User.builder().id(userId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(user)
                                .directoryPath("/projects/backend")
                                .build();

                CodeBlock codeBlock = CodeBlock.builder()
                                .blockId("block-uuid-001")
                                .noteId(noteId.toString())
                                .bookmark(true)
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

                given(noteRepository.findById(noteId)).willReturn(Optional.of(note));
                given(blockService.getBookmarkedBlocks(noteId.toString(), page, size)).willReturn(blockPage);

                // when
                BlockPageResponse response = noteService.getBlockBookmarks(userId, noteId, page, size);

                // then
                assertThat(response.content()).hasSize(1);
                assertThat(response.currentPage()).isEqualTo(1); // 1-based
                assertThat(response.totalElements()).isEqualTo(1);
                assertThat(response.content().get(0).noteId()).isEqualTo(noteId.toString());
                assertThat(response.content().get(0).notePath()).isEqualTo("/projects/backend");
                assertThat(response.content().get(0).bookmark()).isTrue();

                verify(blockService).getBookmarkedBlocks(noteId.toString(), page, size);
        }
}
