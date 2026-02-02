package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.dto.response.BlockDetailResponse;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.dto.request.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.response.ExecutionHistoryResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;
    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;

    // 노트 ID로 블록 목록 조회 (순서 보장)
    public List<BaseBlock> getBlocksByNoteId(UUID noteId) {
        return blockRepository.findByNoteIdOrderByOrderAsc(noteId);
    }

    // 코드 실행 이력 저장
    @Transactional
    public void saveExecutionHistory(UUID noteId, UUID blockId, ExecutionHistoryRequest request) {
        // 1. 블록 조회
        BaseBlock baseBlock = blockRepository.findByBlockId(blockId)
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
        // 1. 블록 조회
        BaseBlock baseBlock = blockRepository.findByBlockId(blockId)
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
    public void bookmarkBlock(UUID blockId, UUID noteId) {
        BaseBlock block = blockRepository.findByBlockId(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 블록이 해당 노트에 속하는지 검증
        if (!block.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        block.setBookmark();
        blockRepository.save(block);
        log.info("Bookmarked block: {}", blockId);
    }

    @Transactional
    public void unbookmarkBlock(UUID blockId, UUID noteId) {
        BaseBlock block = blockRepository.findByBlockId(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 블록이 해당 노트에 속하는지 검증
        if (!block.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        block.unBookmark();
        blockRepository.save(block);
        log.info("Unbookmarked block: {}", blockId);
    }

    public Page<BaseBlock> getBookmarkedBlocks(UUID noteId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return blockRepository.findByNoteIdAndBookmarkTrueOrderByUpdatedAtDesc(noteId, pageable);
    }

    public List<BlockDetailResponse> getBlocks(UUID memberId, UUID noteId) {
        // 노트 접근 권한
        validateReadPermission(memberId, noteId);

        List<BaseBlock> blocks = blockRepository.findByNoteIdOrderByOrderAsc(noteId);

        return blocks.stream()
                .map(BlockResponseMapper::from)
                .toList();
    }

    public void validateReadPermission(UUID memberId, UUID noteId) {
        // 노트가 있는지
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 노트 작성자인 경우
        if (note.getCreatedBy().getId().equals(memberId)) return;

        // 노트 멤버인 경우
        noteMemberRepository.findRoleByNoteIdAndMemberId(noteId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));
    }

}