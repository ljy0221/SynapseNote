package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.BlockHistory;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.dto.response.BlockHistoryDetailResponse;
import com.synapse.api.modules.block.dto.response.BlockHistoryResponse;
import com.synapse.api.modules.block.repository.BlockHistoryRepository;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockHistoryService {

        private final BlockHistoryRepository blockHistoryRepository;
        private final BlockRepository blockRepository;
        private final NoteMemberRepository noteMemberRepository;
        private final MemberRepository memberRepository;

        /**
         * 블록 히스토리 목록 조회
         */
        public Page<BlockHistoryResponse> getBlockHistory(
                        String noteId,
                        String blockId,
                        UUID memberId,
                        Pageable pageable) {
                verifyNoteAccess(noteId, memberId);
                BaseBlock block = verifyBlockOwnership(blockId, noteId);
                validateCodeBlock(block);

                return blockHistoryRepository
                                .findByBlockIdOrderByChangedAtDesc(blockId, pageable)
                                .map(BlockHistoryResponse::from);
        }

        /**
         * 노트 접근 권한 확인
         */
        private void verifyNoteAccess(String noteId, UUID memberId) {
                noteMemberRepository.findByNoteIdAndMemberId(
                                UUID.fromString(noteId), memberId)
                                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));
        }

        /**
         * 블록 소유권 확인 (블록 반환)
         */
        private BaseBlock verifyBlockOwnership(String blockId, String noteId) {
                UUID blockUuid;
                try {
                        blockUuid = UUID.fromString(blockId);
                } catch (IllegalArgumentException e) {
                        throw new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND);
                }

                BaseBlock block = blockRepository.findByBlockId(blockUuid)
                                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

                if (!block.getNoteId().equals(noteId)) {
                        throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
                }

                return block;
        }

        /**
         * CodeBlock 타입 검증
         */
        private void validateCodeBlock(BaseBlock block) {
                if (!(block instanceof CodeBlock)) {
                        throw new BusinessException(ErrorCode.INVALID_BLOCK_TYPE_FOR_HISTORY);
                }
        }

        /**
         * 슬롯에 저장
         */
        public BlockHistoryResponse saveToSlot(
                        String noteId,
                        String blockId,
                        int slotNumber,
                        UUID memberId) {
                verifyNoteAccess(noteId, memberId);
                BaseBlock currentBlock = verifyBlockOwnership(blockId, noteId);
                validateCodeBlock(currentBlock);

                Optional<BlockHistory> existingSlot = blockHistoryRepository
                                .findByBlockIdAndSlotNumber(blockId, slotNumber);

                Member member = memberRepository.findById(memberId)
                                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

                Map<String, Object> currentProperties = extractProperties(currentBlock);

                BlockHistory newHistory = BlockHistory.builder()
                                .blockId(blockId)
                                .noteId(noteId)
                                .slotNumber(slotNumber)
                                .properties(currentProperties)
                                .blockType(currentBlock.getType().name())
                                .changedBy(new BlockHistory.ChangedBy(memberId.toString(), member.getName()))
                                .changedAt(LocalDateTime.now())
                                .changeDescription(String.format("Saved to slot %d", slotNumber))
                                .build();

                boolean isOverwrite = existingSlot.isPresent();
                existingSlot.ifPresent(slot -> {
                        log.info("Overwriting existing slot: blockId={}, slotNumber={}", blockId, slotNumber);
                        blockHistoryRepository.deleteById(slot.getId());
                });
                BlockHistory saved = blockHistoryRepository.save(newHistory);

                log.info("Saved to slot: blockId={}, slotNumber={}, isOverwrite={}", blockId, slotNumber, isOverwrite);

                return BlockHistoryResponse.from(saved);
        }

        /**
         * 슬롯 조회
         */
        public BlockHistoryDetailResponse getSlot(
                        String noteId,
                        String blockId,
                        int slotNumber,
                        UUID memberId) {
                verifyNoteAccess(noteId, memberId);
                BaseBlock block = verifyBlockOwnership(blockId, noteId);
                validateCodeBlock(block);

                BlockHistory history = blockHistoryRepository
                                .findByBlockIdAndSlotNumber(blockId, slotNumber)
                                .orElseThrow(() -> new BusinessException(ErrorCode.BLOCK_HISTORY_NOT_FOUND));

                return BlockHistoryDetailResponse.from(history);
        }

        /**
         * 모든 슬롯 조회
         */
        public List<BlockHistoryResponse> getAllSlots(
                        String noteId,
                        String blockId,
                        UUID memberId) {
                verifyNoteAccess(noteId, memberId);
                BaseBlock block = verifyBlockOwnership(blockId, noteId);
                validateCodeBlock(block);

                List<BlockHistory> allSlots = blockHistoryRepository
                                .findByBlockIdOrderBySlotNumberAsc(blockId);

                return allSlots.stream()
                                .map(BlockHistoryResponse::from)
                                .toList();
        }

        /**
         * 블록에서 properties 추출
         */
        private Map<String, Object> extractProperties(BaseBlock block) {
                Map<String, Object> properties = new HashMap<>();

                // 이미 validateCodeBlock()에서 검증되었으므로 안전한 캐스팅
                CodeBlock codeBlock = (CodeBlock) block;
                CodeBlock.CodeProperties props = codeBlock.getProperties();
                if (props != null) {
                        properties.put("language", java.util.Objects.requireNonNullElse(props.getLanguage(), ""));
                        properties.put("code", java.util.Objects.requireNonNullElse(props.getCode(), ""));
                        properties.put("version", java.util.Objects.requireNonNullElse(props.getVersion(), ""));
                        properties.put("executionMode", java.util.Objects.requireNonNullElse(props.getExecutionMode(), ""));
                }

                return properties;
        }
}
