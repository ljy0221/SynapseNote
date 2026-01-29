package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.dto.request.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.response.ExecutionHistoryResponse;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;

    // 노트 ID로 블록 목록 조회 (순서 보장)
    public List<BaseBlock> getBlocksByNoteId(String noteId) {
        return blockRepository.findByNoteIdOrderByOrderAsc(noteId);
    }

    // 코드 실행 이력 저장
    @Transactional
    public void saveExecutionHistory(String noteId, String blockId, ExecutionHistoryRequest request) {
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

    /**
     * [요청하신 메소드] 실행 히스토리 조회
     */
    public List<ExecutionHistoryResponse> getExecutionHistory(String noteId, String blockId) {
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

    /**
     * 블록 북마크 설정
     */
    @Transactional
    public void bookmarkBlock(String blockId, String noteId) {
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

    /**
     * 블록 북마크 해제
     */
    @Transactional
    public void unbookmarkBlock(String blockId, String noteId) {
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

    /**
     * 북마크된 블록 목록 조회 (페이지네이션)
     */
    public Page<BaseBlock> getBookmarkedBlocks(String noteId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return blockRepository.findByNoteIdAndBookmarkTrueOrderByUpdatedAtDesc(noteId, pageable);
    }
}