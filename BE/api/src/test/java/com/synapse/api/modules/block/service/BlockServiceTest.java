package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import com.synapse.api.modules.block.entity.BlockBookmark;
import com.synapse.api.modules.block.repository.BlockBookmarkRepository;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.member.entity.Member;
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
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BlockServiceTest {

        @InjectMocks
        private BlockService blockService;

        @Mock
        private BlockRepository blockRepository;

        @Mock
        private BlockBookmarkRepository blockBookmarkRepository;

        @Mock
        private NoteRepository noteRepository;

        @Test
        @DisplayName("블록 즐겨찾기를 설정한다")
        void bookmarkBlock() {
                // given
                UUID blockId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();
                UUID memberId = UUID.randomUUID();

                Member member = Member.builder().id(memberId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(member)
                                .build();

                CodeBlock codeBlock = CodeBlock.builder()
                                .blockId(blockId)
                                .noteId(noteId)
                                .properties(CodeBlock.CodeProperties.builder()
                                                .language("python")
                                                .code("print('hello')")
                                                .build())
                                .build();

                given(blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)).willReturn(Optional.of(codeBlock));
                given(noteRepository.findById(noteId)).willReturn(Optional.of(note));
                given(blockBookmarkRepository.existsByBlockIdAndDeletedAtIsNull(blockId)).willReturn(false);

                // when
                blockService.bookmarkBlock(blockId, noteId, memberId);

                // then
                verify(blockBookmarkRepository).save(any(BlockBookmark.class));
        }

        @Test
        @DisplayName("블록 즐겨찾기를 해제한다")
        void unbookmarkBlock() {
                // given
                UUID blockId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();
                UUID memberId = UUID.randomUUID();

                Member member = Member.builder().id(memberId).build();
                Note note = Note.builder()
                                .id(noteId)
                                .createdBy(member)
                                .build();

                TextBlock textBlock = TextBlock.builder()
                                .blockId(blockId)
                                .noteId(noteId)
                                .properties(TextBlock.TextProperties.builder()
                                                .content("# Title\\n\\nContent")
                                                .build())
                                .build();

                BlockBookmark bookmark = BlockBookmark.create(blockId, note);

                given(blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)).willReturn(Optional.of(textBlock));
                given(noteRepository.findById(noteId)).willReturn(Optional.of(note));
                given(blockBookmarkRepository.findByBlockIdAndDeletedAtIsNull(blockId))
                                .willReturn(Optional.of(bookmark));

                // when
                blockService.unbookmarkBlock(blockId, noteId, memberId);

                // then
                // then
                verify(blockBookmarkRepository).delete(any(BlockBookmark.class));
        }
}
