package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.entity.BlockBookmark;
import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Builder
public record BlockPageResponse(
        List<BlockResponse> content,
        int currentPage,
        int totalPages,
        long totalElements,
        int size,
        boolean hasNext,
        boolean hasPrevious) {

    // 단일 notePath, 북마크 상태 포함
    public static BlockPageResponse from(Page<BaseBlock> page, String notePath, Set<UUID> bookmarkedBlockIds) {
        return BlockPageResponse.builder()
                .content(page.getContent().stream()
                        .map(block -> {
                            boolean isBookmarked = bookmarkedBlockIds
                                    .contains(block.getBlockId());
                            return BlockResponse.from(block, notePath, isBookmarked);
                        })
                        .toList())
                .currentPage(page.getNumber() + 1) // 1-based
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }

    // 여러 notePath, 북마크 상태 포함
    public static BlockPageResponse from(Page<BaseBlock> page, Map<UUID, String> notePathMap,
                                         Set<UUID> bookmarkedBlockIds) {
        return BlockPageResponse.builder()
                .content(page.getContent().stream()
                        .map(block -> {
                            String path = notePathMap.getOrDefault(block.getNoteId(), "");
                            boolean isBookmarked = bookmarkedBlockIds
                                    .contains(block.getBlockId());
                            return BlockResponse.from(block, path, isBookmarked);
                        })
                        .toList())
                .currentPage(page.getNumber() + 1) // 1-based
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }

    // BlockBookmark 페이지를 처리하는 from 메서드 (북마크된 블록만 조회하므로 모두 true)
    public static BlockPageResponse from(Page<BlockBookmark> bookmarks, Map<UUID, BaseBlock> blockMap,
                                         Map<UUID, String> notePathMap) {
        return BlockPageResponse.builder()
                .content(bookmarks.getContent().stream()
                        .map(bookmark -> {
                            BaseBlock block = blockMap.get(bookmark.getBlockId());
                            String path = notePathMap
                                    .getOrDefault(bookmark.getNote().getId(), "");
                            return block != null ? BlockResponse.from(block, path, true)
                                    : null;
                        })
                        .filter(response -> response != null)
                        .toList())
                .currentPage(bookmarks.getNumber() + 1) // 1-based
                .totalPages(bookmarks.getTotalPages())
                .totalElements(bookmarks.getTotalElements())
                .size(bookmarks.getSize())
                .hasNext(bookmarks.hasNext())
                .hasPrevious(bookmarks.hasPrevious())
                .build();
    }

    // 빈 결과를 반환하는 메서드
    public static BlockPageResponse empty() {
        return BlockPageResponse.builder()
                .content(List.of())
                .currentPage(1)
                .totalPages(0)
                .totalElements(0)
                .size(0)
                .hasNext(false)
                .hasPrevious(false)
                .build();
    }
}
