package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.dto.response.BlockDetailResponse;
import com.synapse.api.modules.block.dto.response.BlockPageResponse;
import com.synapse.api.modules.block.entity.BlockBookmark;
import com.synapse.api.modules.block.repository.BlockBookmarkRepository;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.dto.request.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.response.ExecutionHistoryResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.note.service.NoteValidator;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;
    private final BlockBookmarkRepository blockBookmarkRepository;
    private final NoteRepository noteRepository;
    private final NoteValidator noteValidator;

    // 노트 ID로 블록 목록 조회 (순서 보장, 삭제 안 된 것만)
    public List<BaseBlock> getBlocksByNoteId(UUID noteId) {
        return blockRepository.findByNoteIdAndDeletedAtIsNullOrderByOrderAsc(noteId);
    }

    // 코드 실행 이력 저장
    @Transactional
    public void saveExecutionHistory(UUID noteId, UUID blockId, ExecutionHistoryRequest request) {
        // 1. 블록 조회 (삭제 안 된 것만)
        BaseBlock baseBlock = blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 2. 데이터 무결성 검증 (블록이 해당 노트 소유인지)
        if (!baseBlock.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // 3. CodeBlock 타입 확인 및 저장
        if (baseBlock instanceof CodeBlock codeBlock) {
            codeBlock.execute(
                    request.output(),
                    request.executionTimeMs(),
                    request.status());
            blockRepository.save(codeBlock); // MongoDB Update
            log.info("Saved execution history for block: {}", blockId);
        } else {
            throw new BusinessException(ErrorCode.INVALID_BLOCK_TYPE);
        }
    }

    public List<ExecutionHistoryResponse> getExecutionHistory(UUID noteId, UUID blockId) {
        // 1. 블록 조회 (삭제 안 된 것만)
        BaseBlock baseBlock = blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 2. 무결성 검증
        if (!baseBlock.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // 3. 히스토리 추출 및 페이징
        if (baseBlock instanceof CodeBlock codeBlock) {
            List<CodeBlock.ExecutionHistory> history = codeBlock.getOutputHistory();
            if (history == null)
                history = new ArrayList<>();

            // 최신순 정렬 (역순)
            List<CodeBlock.ExecutionHistory> reversed = new ArrayList<>(history);
            Collections.reverse(reversed);

            return reversed.stream()
                    .map(ExecutionHistoryResponse::from)
                    .toList();
        }

        // 코드 블록이 아니면 빈 리스트 반환
        return List.of();
    }

    @Transactional
    public void bookmarkBlock(UUID blockId, UUID noteId, UUID memberId) {
        // 1. 블록 존재 여부 확인
        BaseBlock block = blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 2. 블록이 해당 노트에 속하는지 검증
        if (!block.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // 3. 노트 조회 및 소유자 검증
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        if (!note.getCreatedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // 4. 이미 북마크되어 있는지 확인
        if (blockBookmarkRepository.existsByBlockIdAndDeletedAtIsNull(blockId)) {
            log.warn("Block already bookmarked: {}", blockId);
            return;
        }

        // 5. 북마크 생성
        BlockBookmark bookmark = BlockBookmark.create(blockId, note);
        blockBookmarkRepository.save(bookmark);
        log.info("Bookmarked block: {} by member: {}", blockId, memberId);
    }

    @Transactional
    public void unbookmarkBlock(UUID blockId, UUID noteId, UUID memberId) {
        // 1. 블록 존재 여부 확인
        BaseBlock block = blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 2. 블록이 해당 노트에 속하는지 검증
        if (!block.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // 3. 노트 조회 및 소유자 검증
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        if (!note.getCreatedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // 4. 북마크 조회 및 삭제 (Soft Delete)
        BlockBookmark bookmark = blockBookmarkRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKMARK_NOT_FOUND));

        bookmark.delete();
        blockBookmarkRepository.save(bookmark);
        log.info("Unbookmarked block: {} by member: {}", blockId, memberId);
    }

    public List<BlockDetailResponse> getBlocks(UUID memberId, UUID noteId) {
        // 노트 접근 권한
        noteValidator.validateReadPermission(memberId, noteId);

        // 1. 블록 목록 조회
        List<BaseBlock> blocks = blockRepository.findByNoteIdAndDeletedAtIsNullOrderByOrderAsc(noteId);

        // 2. 해당 노트의 북마크 목록 조회 및 Set 변환 (O(1) 조회를 위해)
        Set<UUID> bookmarkedBlockIds = blockBookmarkRepository.findByNoteIdAndDeletedAtIsNull(noteId)
                .stream()
                .map(BlockBookmark::getBlockId)
                .collect(Collectors.toSet());

        // 3. 응답 생성 (북마크 여부 포함)
        return blocks.stream()
                .map(block -> BlockResponseMapper.from(block, bookmarkedBlockIds.contains(block.getBlockId())))
                .toList();
    }

    public BlockPageResponse getAllBookmarkedBlocks(UUID memberId, int page, int size) {
        // 1. PostgreSQL에서 북마크 엔티티 조회 (노트 소유자 기준)
        Pageable pageable = PageRequest.of(page, size);
        Page<BlockBookmark> bookmarks = blockBookmarkRepository.findByNoteCreatedByIdAndDeletedAtIsNull(memberId,
                pageable);

        // 2. 빈 결과 처리
        if (bookmarks.isEmpty()) {
            return BlockPageResponse.empty();
        }

        // 3. blockId 목록 추출
        List<UUID> blockIds = bookmarks.getContent().stream()
                .map(BlockBookmark::getBlockId)
                .toList();

        // 4. MongoDB에서 블록 상세 정보 조회
        List<BaseBlock> blocks = blockRepository.findByBlockIdInAndDeletedAtIsNull(blockIds);

        // 5. blockId를 키로 하는 Map 생성 (빠른 조회)
        Map<UUID, BaseBlock> blockMap = blocks.stream()
                .collect(toMap(BaseBlock::getBlockId, block -> block));

        // 6. 노트 경로 Map 생성
        Map<UUID, String> notePathMap = bookmarks.getContent().stream()
                .collect(toMap(
                        BlockBookmark::getBlockId,
                        bookmark -> bookmark.getNote().getDirectoryPath() != null
                                ? bookmark.getNote().getDirectoryPath()
                                : "",
                        (existing, replacement) -> existing));

        return BlockPageResponse.from(bookmarks, blockMap, notePathMap);
    }

    @Transactional
    public void softDeleteBlocksByNoteId(UUID noteId) {
        blockRepository.softDeleteByNoteId(noteId, LocalDateTime.now());

        blockBookmarkRepository.softDeleteByNoteId(noteId);

        log.info("Soft deleted blocks and bookmarks for note: {}", noteId);
    }
}