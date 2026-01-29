package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.dto.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.ExecutionHistoryResponse;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockService {

    private final BlockRepository blockRepository;

    public List<BaseBlock> getBlocksByNoteId(String noteId) {
        return blockRepository.findByDocIdOrderByOrderAsc(noteId);
    }

    @Transactional
    public void saveExecutionHistory(String noteId, String blockId, ExecutionHistoryRequest request) {
        // 1. 블록 조회
        BaseBlock baseBlock = blockRepository.findByBlockId(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 2. 문서 ID 일치 여부 확인 (Security)
        if (!baseBlock.getDocId().equals(noteId)) {
            throw new BusinessException(ErrorCode.INVALID_BLOCK_ACCESS);
        }

        // 3. 코드 블록 타입 체크 및 실행
        if (baseBlock instanceof CodeBlock codeBlock) {
            codeBlock.execute(
                    request.output(),
                    request.executionTimeMs(),
                    request.status()
            );
            blockRepository.save(codeBlock);
            log.info("Execution history saved for block: {}", blockId);
        } else {
            throw new BusinessException(ErrorCode.INVALID_BLOCK_TYPE);
        }
    }

    public List<ExecutionHistoryResponse> getExecutionHistory(String noteId, String blockId, int page, int size) {
        BaseBlock baseBlock = blockRepository.findByBlockId(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        if (!baseBlock.getDocId().equals(noteId)) {
            throw new BusinessException(ErrorCode.INVALID_BLOCK_ACCESS);
        }

        if (baseBlock instanceof CodeBlock codeBlock) {
            List<CodeBlock.ExecutionHistory> history = codeBlock.getOutputHistory();

            // 최신순 정렬
            List<CodeBlock.ExecutionHistory> reversed = new java.util.ArrayList<>(history);
            Collections.reverse(reversed);

            // 페이징
            int start = page * size;
            int end = Math.min(start + size, reversed.size());

            if (start >= reversed.size()) return List.of();

            return reversed.subList(start, end).stream()
                    .map(ExecutionHistoryResponse::from)
                    .toList();
        }

        return List.of();
    }
}