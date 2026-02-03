package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BlockServiceTest {

        @InjectMocks
        private BlockService blockService;

        @Mock
        private BlockRepository blockRepository;

        @Test
        @DisplayName("블록 즐겨찾기를 설정한다")
        void bookmarkBlock() {
                // given
                UUID blockId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();

                CodeBlock codeBlock = CodeBlock.builder()
                                .blockId(blockId)
                                .noteId(noteId)
                                .bookmark(false)
                                .properties(CodeBlock.CodeProperties.builder()
                                                .language("python")
                                                .code("print('hello')")
                                                .build())
                                .build();

                given(blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)).willReturn(Optional.of(codeBlock));

                // when
                blockService.bookmarkBlock(blockId, noteId);

                // then
                assertThat(codeBlock.isBookmark()).isTrue();
                verify(blockRepository).save(codeBlock);
        }

        @Test
        @DisplayName("블록 즐겨찾기를 해제한다")
        void unbookmarkBlock() {
                // given
                UUID blockId = UUID.randomUUID();
                UUID noteId = UUID.randomUUID();

                TextBlock textBlock = TextBlock.builder()
                                .blockId(blockId)
                                .noteId(noteId)
                                .bookmark(true)
                                .properties(TextBlock.TextProperties.builder()
                                                .content("# Title\n\nContent")
                                                .build())
                                .build();

                given(blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)).willReturn(Optional.of(textBlock));

                // when
                blockService.unbookmarkBlock(blockId, noteId);

                // then
                assertThat(textBlock.isBookmark()).isFalse();
                verify(blockRepository).save(textBlock);
        }

        @Test
        @DisplayName("즐겨찾기된 블록 목록을 페이징하여 조회한다")
        void getBookmarkedBlocks() {
                // given
                UUID noteId = UUID.randomUUID();
                int page = 0;
                int size = 10;

                CodeBlock codeBlock = CodeBlock.builder()
                                .blockId(UUID.randomUUID())
                                .noteId(noteId)
                                .bookmark(true)
                                .order(1.0)
                                .properties(CodeBlock.CodeProperties.builder()
                                                .language("python")
                                                .code("print('test')")
                                                .build())
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                TextBlock textBlock = TextBlock.builder()
                                .blockId(UUID.randomUUID())
                                .noteId(noteId)
                                .bookmark(true)
                                .order(2.0)
                                .properties(TextBlock.TextProperties.builder()
                                                .content("# Important Note")
                                                .build())
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                List<BaseBlock> blocks = List.of(codeBlock, textBlock);
                Page<BaseBlock> blockPage = new PageImpl<>(blocks, PageRequest.of(page, size), blocks.size());

                given(blockRepository.findByNoteIdAndBookmarkTrueAndDeletedAtIsNullOrderByCreatedAtDesc(eq(noteId),
                                any(Pageable.class)))
                                .willReturn(blockPage);

                // when
                Page<BaseBlock> result = blockService.getBookmarkedBlocks(noteId, page, size);

                // then
                assertThat(result.getContent()).hasSize(2);
                assertThat(result.getTotalElements()).isEqualTo(2);
                assertThat(result.getNumber()).isEqualTo(0);
                assertThat(result.getContent().get(0).isBookmark()).isTrue();
                assertThat(result.getContent().get(1).isBookmark()).isTrue();

                verify(blockRepository).findByNoteIdAndBookmarkTrueAndDeletedAtIsNullOrderByCreatedAtDesc(eq(noteId),
                                any(Pageable.class));
        }

        @Test
        @DisplayName("즐겨찾기된 블록이 없으면 빈 페이지를 반환한다")
        void getBookmarkedBlocks_EmptyResult() {
                // given
                UUID noteId = UUID.randomUUID();
                int page = 0;
                int size = 10;

                Page<BaseBlock> emptyPage = new PageImpl<>(List.of(), PageRequest.of(page, size), 0);

                given(blockRepository.findByNoteIdAndBookmarkTrueAndDeletedAtIsNullOrderByCreatedAtDesc(eq(noteId),
                                any(Pageable.class)))
                                .willReturn(emptyPage);

                // when
                Page<BaseBlock> result = blockService.getBookmarkedBlocks(noteId, page, size);

                // then
                assertThat(result.getContent()).isEmpty();
                assertThat(result.getTotalElements()).isEqualTo(0);
        }
}
